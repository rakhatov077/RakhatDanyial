-- «Оқу орталығы» дерекқорының схемасы (PostgreSQL)
-- Скриптті қайта іске қосуға болады: алдымен кестелер өшіріледі.

DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses     CASCADE;
DROP TABLE IF EXISTS students    CASCADE;
DROP TABLE IF EXISTS teachers    CASCADE;

-- Оқытушылар
CREATE TABLE teachers (
    id        SERIAL       PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email     VARCHAR(150) NOT NULL UNIQUE
);

-- Студенттер
CREATE TABLE students (
    id         SERIAL       PRIMARY KEY,
    full_name  VARCHAR(150) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    group_name VARCHAR(50)  NOT NULL
);

-- Курстар: әр курстың нақты бір оқытушысы бар (1:N)
CREATE TABLE courses (
    id          SERIAL       PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    description TEXT,
    hours       INTEGER      NOT NULL CHECK (hours > 0),
    teacher_id  INTEGER      NOT NULL
                REFERENCES teachers (id) ON DELETE RESTRICT
);

-- Байланыстырушы кесте: студент <-> курс (M:N)
-- Құрама бастапқы кілт бір студенттің бір курсқа екі рет жазылуына жол бермейді.
-- grade бос (NULL) болуы мүмкін: баға қойылғанға дейін.
CREATE TABLE enrollments (
    student_id  INTEGER NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    course_id   INTEGER NOT NULL REFERENCES courses  (id) ON DELETE CASCADE,
    enrolled_at DATE    NOT NULL DEFAULT CURRENT_DATE,
    grade       INTEGER CHECK (grade BETWEEN 0 AND 100),
    PRIMARY KEY (student_id, course_id)
);
