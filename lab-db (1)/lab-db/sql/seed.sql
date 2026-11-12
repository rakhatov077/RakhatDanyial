-- Бастапқы деректер: әр кестеде 4-5 жазба

INSERT INTO teachers (full_name, email) VALUES
 ('Серіков Асхат Бауыржанұлы',   'a.serikov@center.kz'),
 ('Нұрғалиева Дана Ермекқызы',   'd.nurgalieva@center.kz'),
 ('Қасымов Тимур Асланұлы',      't.kasymov@center.kz'),
 ('Ахметова Айгерім Серікқызы',  'a.akhmetova@center.kz');

INSERT INTO students (full_name, email, group_name) VALUES
 ('Оразов Мирас',        'miras.orazov@student.kz',    'ИС-21'),
 ('Жұмабаева Аружан',    'aruzhan.zhumabaeva@student.kz','ИС-21'),
 ('Төлеубек Ерлан',      'erlan.toleubek@student.kz',  'ИС-22'),
 ('Беков Санжар',        'sanzhar.bekov@student.kz',   'ИС-22'),
 ('Мұратова Томирис',    'tomiris.muratova@student.kz','ИС-23');

INSERT INTO courses (title, description, hours, teacher_id) VALUES
 ('SQL негіздері',         'Реляциялық дерекқорлар және SQL тілі',        40, 1),
 ('Web-бағдарламалау',     'HTML, CSS және JavaScript негіздері',          60, 2),
 ('Алгоритмдер',           'Алгоритмдер мен деректер құрылымдары',         30, 3),
 ('Python бағдарламалау',  'Python тілінің негіздері',                     24, 2),
 ('Node.js және REST API', 'Express және Sequelize арқылы серверлік қосымша', 36, 1);


INSERT INTO enrollments (student_id, course_id, enrolled_at, grade) VALUES
 (1, 1, '2026-09-01', 92),
 (1, 2, '2026-09-01', 78),
 (2, 1, '2026-09-02', 85),
 (2, 3, '2026-09-02', 64),
 (3, 1, '2026-09-03', 58),
 (3, 2, '2026-09-03', NULL),
 (4, 2, '2026-09-04', 71),
 (4, 3, '2026-09-04', 49),
 (5, 5, '2026-09-05', NULL);
-- «Python бағдарламалау» (id=4) курсына ешкім жазылмаған
