-- Learning Resources (Section 11) — run once in Supabase → SQL Editor → Run
-- Enables subject-based resources, ratings/comments, and admin approval of requests.
-- Requires Section 4 (profiles table) from SUPABASE_SETUP.md to be run first.

-- Admin flag on profiles (for approving resource requests)
alter table public.profiles add column if not exists is_admin boolean default false;

-- Set yourself as admin (replace with your email):
-- update public.profiles set is_admin = true where email = 'you@example.com';

create table if not exists public.learning_resources (
  id uuid default gen_random_uuid() primary key,
  subject text not null,
  title text not null,
  url text,
  description text default '',
  resource_type text default 'website',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  requested_by uuid references auth.users on delete set null,
  approved_by uuid references auth.users on delete set null,
  created_at timestamptz default now()
);

-- Extra profile fields used on resource cards / request form
alter table public.learning_resources add column if not exists cost text default 'Free';
alter table public.learning_resources add column if not exists platform text;
alter table public.learning_resources add column if not exists subjects jsonb default '[]'::jsonb;
alter table public.learning_resources add column if not exists grades jsonb default '[]'::jsonb;
alter table public.learning_resources add column if not exists curriculums jsonb default '[]'::jsonb;
alter table public.learning_resources add column if not exists categories jsonb default '[]'::jsonb;
alter table public.learning_resources add column if not exists best_for jsonb default '[]'::jsonb;
alter table public.learning_resources add column if not exists tips jsonb default '[]'::jsonb;

create table if not exists public.resource_reviews (
  id uuid default gen_random_uuid() primary key,
  resource_id uuid references public.learning_resources on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text default '',
  clarity int check (clarity between 1 and 5),
  depth int check (depth between 1 and 5),
  accuracy int check (accuracy between 1 and 5),
  engagement int check (engagement between 1 and 5),
  exam_relevance int check (exam_relevance between 1 and 5),
  ease_of_use int check (ease_of_use between 1 and 5),
  time_efficiency int check (time_efficiency between 1 and 5),
  created_at timestamptz default now(),
  unique (resource_id, user_id)
);

create table if not exists public.resource_usage (
  resource_id uuid references public.learning_resources on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now(),
  primary key (resource_id, user_id)
);

-- Backfill columns if resource_reviews already existed
alter table public.resource_reviews add column if not exists clarity int check (clarity between 1 and 5);
alter table public.resource_reviews add column if not exists depth int check (depth between 1 and 5);
alter table public.resource_reviews add column if not exists accuracy int check (accuracy between 1 and 5);
alter table public.resource_reviews add column if not exists engagement int check (engagement between 1 and 5);
alter table public.resource_reviews add column if not exists exam_relevance int check (exam_relevance between 1 and 5);
alter table public.resource_reviews add column if not exists ease_of_use int check (ease_of_use between 1 and 5);
alter table public.resource_reviews add column if not exists time_efficiency int check (time_efficiency between 1 and 5);

alter table public.learning_resources enable row level security;
alter table public.resource_reviews enable row level security;
alter table public.resource_usage enable row level security;

-- Anyone logged in or anon can browse approved resources
create policy "read approved resources" on public.learning_resources
  for select using (status = 'approved');

-- Users can submit resource requests (pending)
create policy "users insert resource requests" on public.learning_resources
  for insert with check (auth.uid() is not null and status = 'pending' and requested_by = auth.uid());

-- Admins can read pending/rejected and approve
create policy "admins read all resources" on public.learning_resources
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "admins update resources" on public.learning_resources
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Reviews: anyone can read; logged-in users can add/update their own
create policy "read resource reviews" on public.resource_reviews
  for select using (true);

create policy "users upsert own reviews" on public.resource_reviews
  for insert with check (auth.uid() = user_id);

create policy "users update own reviews" on public.resource_reviews
  for update using (auth.uid() = user_id);

-- Admins can remove resources and reviews (also re-runnable: drop first)
drop policy if exists "admins delete resources" on public.learning_resources;
create policy "admins delete resources" on public.learning_resources
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "admins delete reviews" on public.resource_reviews;
create policy "admins delete reviews" on public.resource_reviews
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

drop policy if exists "users delete own reviews" on public.resource_reviews;
create policy "users delete own reviews" on public.resource_reviews
  for delete using (auth.uid() = user_id);

-- Resource usage ("I'm using this")
create policy "read resource usage" on public.resource_usage
  for select using (true);

create policy "users mark own usage" on public.resource_usage
  for insert with check (auth.uid() = user_id);

create policy "users unmark own usage" on public.resource_usage
  for delete using (auth.uid() = user_id);

-- Well-known starter resources only (skips titles already present)
insert into public.learning_resources (subject, title, url, description, resource_type, status)
select v.subject, v.title, v.url, v.description, v.resource_type, v.status
from (values
  ('Biology', 'Amoeba Sisters', 'https://www.youtube.com/@AmoebaSisters', 'Fun animated biology videos covering cells, genetics, ecology and more.', 'youtube', 'approved'),
  ('Multiple subjects', 'Khan Academy', 'https://www.khanacademy.org/', 'Free lessons and practice across Biology, Chemistry, Physics, Maths, History, Economics and more.', 'website', 'approved'),
  ('Multiple subjects', 'Crash Course', 'https://www.youtube.com/@crashcourse', 'Fast, engaging video explainers across science, history, geography, economics, government and anatomy.', 'youtube', 'approved'),
  ('Multiple subjects', 'ATAR Notes', 'https://atarnotes.com/', 'Free HSC notes, lectures, articles and forums, plus study guides written by recent high achievers.', 'website', 'approved'),
  ('Multiple subjects', 'AceHSC', 'https://www.acehsc.net/', 'NSW HSC past papers, study notes, essays and quizzes are free. Lessons and tutoring are paid.', 'website', 'approved'),
  ('Multiple subjects', 'Talent 100', 'https://talent-100.com.au/', 'HSC tutoring programs, syllabus resources and an ATAR calculator for NSW students.', 'website', 'approved'),
  ('Multiple subjects', 'Art of Smart', 'https://artofsmart.com.au/', 'HSC platform with free AI tutors (Artie for English, Allie for Biology, Business, Economics, Legal Studies and more), plus NESA and trial past papers with questions sorted by topic for each subject.', 'website', 'approved'),
  ('Multiple subjects', 'Excel HSC Copilot', 'https://www.excelhsccopilot.com.au/', 'Paid HSC study platform from the Excel Study Guides team: weekly plans, syllabus resources, past Prelim/HSC questions and AI feedback across many NSW subjects.', 'website', 'approved'),
  ('Multiple subjects', 'THSC Online', 'https://thsconline.github.io/s/', 'Free NSW practice and past papers organised by year (Years 9–12), covering a wide mix of HSC and miscellaneous subjects.', 'website', 'approved'),
  ('English', 'Edexia', 'https://edexia.com/', 'AI essay grading and feedback calibrated to HSC (and other) English rubrics, including Common Module and Modules A–C.', 'website', 'approved'),
  ('Multiple subjects', 'StudyPulse HSC', 'https://studypulse.education/hsc/', 'HSC exam prep with past-paper style questions, instant AI marking and progress tracking across many NSW subjects.', 'website', 'approved'),
  ('Multiple subjects', 'Study Marker', 'https://www.studymarker.com/', 'Upload practice answers for instant AI feedback, plus syllabus explainers, flashcards and quiz maker for HSC/VCE-style study.', 'website', 'approved'),
  ('English', 'Dodie.ai', 'https://dodie.ai/', 'AI HSC English companion built with state rankers: essay feedback, analysis tools and writing helpers (including a free plan).', 'website', 'approved'),
  ('English', 'Polarbear HSC Essay Marking', 'https://www.trypolarbear.com/blog/hsc-essay-marking', 'Instant AI essay marking against NESA guidelines and performance bands, with examiner-style feedback for HSC English.', 'website', 'approved'),
  ('Multiple subjects', 'ExamLab', 'https://examlab.com.au/#pricing', 'NSW HSC prep with syllabus-aligned practice and Marky, an AI examiner trained on NESA-style marking across many subjects.', 'website', 'approved'),
  ('Multiple subjects', 'Science Ready', 'https://scienceready.com.au/', 'HSC Chemistry and Physics notes, syllabus videos and topic tests from experienced educators and state rankers.', 'website', 'approved'),
  ('Multiple subjects', 'Studocu High School', 'https://www.studocu.com/en-au/high-school-degree', 'Student-shared high school notes, assignments and study materials for Australian courses including HSC subjects.', 'website', 'approved'),
  ('Multiple subjects', 'High School Notes (Free)', 'https://highschoolnotes.com.au/free', 'Free Australian high school and HSC study notes shared by students, including syllabus-sorted science notes.', 'website', 'approved'),
  ('Multiple subjects', 'Australian Science Olympiads', 'https://asi.edu.au/program/australian-science-olympiads/', 'Official ASI hub for Biology, Chemistry, Physics and Earth & Environmental Science Olympiads: syllabi, past exams, and free practice on Olympiads Online.', 'website', 'approved'),
  ('Chemistry', 'ChemCollective', 'https://chemcollective.org/', 'Free virtual chemistry labs, simulations, tutorials and concept activities for school and first-year chemistry.', 'website', 'approved'),
  ('Physics', 'Physics Classroom', 'https://www.physicsclassroom.com/', 'Clear tutorials and problem sets for school physics.', 'website', 'approved'),
  ('Physics', 'Veritasium', 'https://www.youtube.com/@veritasium', 'Popular science videos that strengthen physics understanding.', 'youtube', 'approved'),
  ('Mathematics', 'Desmos', 'https://www.desmos.com/calculator', 'Interactive graphing calculator for functions and graphs.', 'website', 'approved'),
  ('Mathematics', '3Blue1Brown', 'https://www.youtube.com/@3blue1brown', 'Famous visual maths explanations for deeper understanding.', 'youtube', 'approved'),
  ('Mathematics', 'Wolfram Alpha', 'https://www.wolframalpha.com/', 'Well-known tool for solving equations and checking maths answers.', 'website', 'approved'),
  ('Mathematics', 'Eddie Woo videos', 'https://www.youtube.com/c/misterwootube', 'Eddie Woo’s free maths video lessons with clear classroom-style explanations for junior and senior high school.', 'youtube', 'approved'),
  ('Mathematics', 'Mathos AI', 'https://www.mathos.ai/', 'AI maths solver and tutor (formerly Math GPT) with step-by-step solutions, photo solve and practice across school and advanced maths.', 'website', 'approved'),
  ('Mathematics', 'GeoGebra', 'https://www.geogebra.org/?lang=en', 'Free interactive geometry, algebra, graphing and 3D maths tools for exploring concepts and checking constructions.', 'website', 'approved'),
  ('Mathematics', 'Censai', 'https://www.censai.com.au/', 'Personalised HSC Maths practice with adaptive questions, guided answers and a learning profile aligned to the NESA syllabus.', 'website', 'approved'),
  ('English', 'SparkNotes', 'https://www.sparknotes.com/', 'Popular summaries and analysis for novels and plays.', 'website', 'approved'),
  ('English', 'LitCharts', 'https://www.litcharts.com/', 'Clear themes, quotes and analysis for English texts.', 'website', 'approved'),
  ('English', 'Shmoop', 'https://www.shmoop.com/', 'Literature guides, summaries, analysis and study help written in a clear, student-friendly style.', 'website', 'approved'),
  ('History', 'National Archives of Australia', 'https://www.naa.gov.au/students-and-teachers/classroom-resources', 'Free curriculum-aligned classroom resources, primary sources and inquiry activities from Australia’s national archives.', 'website', 'approved'),
  ('History', 'HTANSW Student Resources', 'https://htansw.asn.au/Resources/Student-Resources', 'History Teachers’ Association of NSW curated resources for senior Ancient, Modern and History Extension students.', 'website', 'approved'),
  ('History', 'State Library NSW HSC History', 'https://www.sl.nsw.gov.au/learning/hsc/hsc-history', 'Free State Library of NSW learning guides and source collections tailored to HSC History courses.', 'website', 'approved'),
  ('Multiple subjects', 'Learnable HSC', 'https://www.learnable.education/hsc-resources/', 'Interactive HSC science lessons, syllabus-mapped practice questions, quizzes and exam simulator for NSW Biology, Chemistry and Physics.', 'website', 'approved'),
  ('Multiple subjects', 'HSC Science', 'https://hscscience.com.au/', 'HSC science study hub with notes, explanations and exam-focused resources for NSW Biology, Chemistry and Physics.', 'website', 'approved'),
  ('English', 'Jeddle', 'https://jeddle.com/', 'HSC English study platform with course notes, exam prep and AI essay tools from high-achieving tutors.', 'website', 'approved'),
  ('Mathematics', 'HSC Maths by Topic', 'https://hscmathsbytopic.firsteducation.com.au/', 'HSC maths practice organised by topic for Standard, Advanced and Extension pathways.', 'website', 'approved'),
  ('Mathematics', 'MathWorld', 'https://mathworld.wolfram.com/', 'Wolfram’s encyclopaedia of mathematics: definitions, diagrams and deeper explanations for almost any maths topic.', 'website', 'approved'),
  ('English', 'myShakespeare', 'https://myshakespeare.com/', 'Interactive Shakespeare texts with modern translations, notes and multimedia to support English literature study.', 'website', 'approved'),
  ('English', 'Project Gutenberg', 'https://www.gutenberg.org/', 'Free public-domain books and classic literature texts you can read online or download for English study.', 'website', 'approved'),
  ('PDHPE', 'HMS PDHPE', 'https://hms.pdhpe.net/', 'NSW Health and Movement Science hub for Year 11–12: syllabus content, revision resources and exam support (HMS / PDHPE).', 'website', 'approved'),
  ('Biology', 'BioNinja', 'https://ib.bioninja.com.au/', 'Free IB Biology syllabus notes, quizzes and review resources organised by topic and theme.', 'website', 'approved'),
  ('Languages', 'Conjuguemos', 'https://www.conjuguemos.com/', 'Language practice focused on Spanish, with verb conjugations, vocabulary, grammar and listening games. Also covers French, German, Italian, Portuguese and Latin.', 'website', 'approved'),
  ('Languages', 'Tex’s French Grammar', 'https://www.laits.utexas.edu/tex/gr/index.html', 'University of Texas free French grammar reference with clear explanations and practice for each topic.', 'website', 'approved'),
  ('Languages', 'Learn a Language', 'https://www.learnalanguage.com/', 'Free language lessons, games and activities across Spanish, French, German, Italian, Portuguese, Latin and more.', 'website', 'approved'),
  ('Languages', 'LinGo Play', 'https://www.lingo-play.com/', 'Gamified language app with flashcards, vocab drills and multiplayer practice across many languages.', 'app', 'approved'),
  ('Geography', 'National Geographic', 'https://www.nationalgeographic.com/', 'Well-known geography articles, maps and case studies.', 'website', 'approved'),
  ('Multiple subjects', 'Save My Exams', 'https://www.savemyexams.com/', 'Examiner-written revision notes, topic questions and past-paper style practice for IB and international exam courses.', 'website', 'approved'),
  ('Multiple subjects', 'Julius AI', 'https://julius.ai/', 'AI data analysis helper that turns spreadsheets and datasets into charts, stats and plain-English insights — useful for maths, science and research tasks.', 'website', 'approved'),
  ('Other', 'Anki', 'https://apps.ankiweb.net/', 'Powerful spaced-repetition flashcard app for long-term memorisation across any subject.', 'app', 'approved'),
  ('Multiple subjects', 'Gizmos', 'https://gizmos.explorelearning.com/', 'ExploreLearning interactive science and maths simulations (virtual labs) for exploring concepts hands-on.', 'website', 'approved'),
  ('Multiple subjects', 'SnapSolve AI', 'https://snapsolve.ai/', 'Photo homework solver that reads a problem from a picture and returns an answer with AI help.', 'website', 'approved'),
  ('Other', 'Notion', 'https://www.notion.so/', 'Flexible notes and organisation workspace for study plans, syllabus trackers and linked subject pages.', 'website', 'approved'),
  ('Multiple subjects', 'Course Hero', 'https://www.coursehero.com/', 'Large library of shared study documents, notes and practice materials across many high school subjects.', 'website', 'approved'),
  ('Other', 'Zotero', 'https://www.zotero.org/', 'Free reference manager for collecting sources, citing and building bibliographies for essays and research tasks.', 'website', 'approved'),
  ('Other', 'Bevinzey', 'https://bevinzey.com/', 'AI study platform that turns your notes, PDFs and lectures into flashcards, practice questions and an adaptive study plan.', 'website', 'approved'),
  ('Other', 'Knowt', 'https://knowt.com/', 'AI-powered flashcards, notes and spaced-repetition study tools — a popular Quizlet-style alternative.', 'website', 'approved'),
  ('Other', 'Quizlet', 'https://quizlet.com/', 'Very popular flashcards and practice for any subject.', 'app', 'approved'),
  ('Other', 'YouTube Education', 'https://www.youtube.com/', 'Huge library of study videos across every subject.', 'youtube', 'approved'),
  ('Other', 'Google Scholar', 'https://scholar.google.com/', 'Search academic articles and reliable sources for research.', 'website', 'approved')
) as v(subject, title, url, description, resource_type, status)
where not exists (
  select 1 from public.learning_resources lr where lr.title = v.title and lr.subject = v.subject
);

-- Hide older per-subject Khan Academy / Crash Course / split ASO rows superseded by combined cards
update public.learning_resources
set status = 'rejected'
where status = 'approved'
  and (
    (title ilike 'Khan Academy%' and title <> 'Khan Academy')
    or (title ilike 'Crash Course%' and title <> 'Crash Course')
    or title in (
      'Olympiads Online',
      'ASO Biology Syllabus',
      'ASO Chemistry Syllabus',
      'ASO Physics Syllabus',
      'ASO Earth & Environmental Science Syllabus',
      'ASO Past Exams & Resources',
      'ORAC Informatics Training',
      'Australian Maths Trust Olympiads',
      'Math GPT'
    )
  );
