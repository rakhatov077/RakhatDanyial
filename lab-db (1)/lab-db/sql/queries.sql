-- ============================================================
-- Сұраныстар. Әрқайсысының алдында не істейтіні жазылған.
-- ============================================================

-- 1. SELECT + WHERE + ORDER BY + LIMIT:
--    ұзақтығы 30 сағаттан асатын курстар, ең ұзақтары бірінші, үздік 3-еуі.
SELECT id, title, hours
FROM courses
WHERE hours > 30
ORDER BY hours DESC
LIMIT 3;

-- 2. INNER JOIN: курстар және олардың оқытушылары.
SELECT c.id, c.title, c.hours, t.full_name AS teacher
FROM courses c
INNER JOIN teachers t ON t.id = c.teacher_id
ORDER BY c.title;

-- 3. LEFT JOIN: ешкім жазылмаған курстар
--    (enrollments жағында сәйкестік жоқ жолдар NULL болады).
SELECT c.id, c.title
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
WHERE e.student_id IS NULL;

-- 4. Үш кестені JOIN: студент, курс, баға.
SELECT s.full_name AS student, c.title AS course, e.grade
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses  c ON c.id = e.course_id
ORDER BY s.full_name, c.title;

-- 5. GROUP BY + HAVING: курстар бойынша орташа баға,
--    тек орташа бағасы 70-тен жоғары курстар (баға қойылмаған жазбалар AVG-ге кірмейді).
SELECT c.title, ROUND(AVG(e.grade), 2) AS avg_grade, COUNT(e.grade) AS graded
FROM courses c
JOIN enrollments e ON e.course_id = c.id
GROUP BY c.id, c.title
HAVING AVG(e.grade) > 70
ORDER BY avg_grade DESC;

-- 6. Ішкі сұраным: барлық жазбалардың орташа бағасынан жоғары баға алған студенттер.
SELECT s.full_name, c.title, e.grade
FROM enrollments e
JOIN students s ON s.id = e.student_id
JOIN courses  c ON c.id = e.course_id
WHERE e.grade > (SELECT AVG(grade) FROM enrollments)
ORDER BY e.grade DESC;

-- 7. UPDATE шартымен: 3-студенттің SQL курсындағы (id=1) бағасын түзету.
UPDATE enrollments
SET grade = 65
WHERE student_id = 3 AND course_id = 1;

-- 8. DELETE шартымен: бағасы әлі қойылмаған жазылуларды өшіру (мысал ретінде
--    нақты студент пен курс бойынша шектейміз).
DELETE FROM enrollments
WHERE student_id = 5 AND course_id = 5 AND grade IS NULL;

-- 9. Транзакция: студентті курсқа жазу және бірден баға қою.
--    Екі әрекет те орындалады немесе ешқайсысы орындалмайды.
BEGIN;
  INSERT INTO enrollments (student_id, course_id, enrolled_at)
  VALUES (5, 4, CURRENT_DATE);

  UPDATE enrollments
  SET grade = 88
  WHERE student_id = 5 AND course_id = 4;
COMMIT;
-- Қате болған жағдайда COMMIT орнына ROLLBACK; жазылады:
-- BEGIN; ...; ROLLBACK;

-- ------------------------------------------------------------
-- Бонус (+5): индекс және EXPLAIN ANALYZE
-- Кесте кішкентай болғандықтан, алдымен көп деректі уақытша жасаймыз.
-- ------------------------------------------------------------
INSERT INTO students (full_name, email, group_name)
SELECT 'Тест студент ' || g, 'test' || g || '@student.kz', 'ТЕСТ-' || (g % 10)
FROM generate_series(1, 50000) AS g;

INSERT INTO enrollments (student_id, course_id, enrolled_at, grade)
SELECT s.id, 1 + (s.id % 5), CURRENT_DATE, (s.id * 7) % 101
FROM students s
WHERE s.email LIKE 'test%@student.kz'
ON CONFLICT DO NOTHING;

-- (а) Индекске дейін: course_id бойынша іздеу (PK бірінші бағанасы student_id, сондықтан
--     course_id бойынша іздеуге PK индексі көмектеспейді -> Seq Scan).
EXPLAIN ANALYZE
SELECT * FROM enrollments WHERE course_id = 3;

CREATE INDEX idx_enrollments_course_id ON enrollments (course_id);
ANALYZE enrollments;

-- (ә) Индекстен кейін: жоспар Index/Bitmap Scan-ға ауысады, орындалу уақыты азаяды.
EXPLAIN ANALYZE
SELECT * FROM enrollments WHERE course_id = 3;

-- Уақытша деректерді тазалау
DELETE FROM enrollments WHERE student_id IN (SELECT id FROM students WHERE email LIKE 'test%@student.kz');
DELETE FROM students WHERE email LIKE 'test%@student.kz';
