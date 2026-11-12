const express = require('express');
const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError } = require('sequelize');
const { Course, Teacher, Student, Enrollment } = require('./db');

const app = express();
app.use(express.json());

// async қателерін ортақ өңдеушіге жіберетін көмекші
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const isInt = (v) => Number.isInteger(v) && v > 0;
const parseId = (v) => (/^\d+$/.test(v) ? Number(v) : null);

// Курс денесін тексеру. partial=false: POST (барлық міндетті өріс), true: PUT
function validateCourse(body, partial) {
  const errors = [];
  const { title, description, hours, teacherId } = body || {};
  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) errors.push('title: бос емес жол болуы керек');
  }
  if (!partial || hours !== undefined) {
    if (!isInt(hours)) errors.push('hours: 0-ден үлкен бүтін сан болуы керек');
  }
  if (!partial || teacherId !== undefined) {
    if (!isInt(teacherId)) errors.push('teacherId: оң бүтін сан болуы керек');
  }
  if (description !== undefined && description !== null && typeof description !== 'string') {
    errors.push('description: жол болуы керек');
  }
  return errors;
}

// GET /courses - оқытушысымен бірге
app.get('/courses', wrap(async (req, res) => {
  const courses = await Course.findAll({ include: Teacher, order: [['id', 'ASC']] });
  res.status(200).json(courses);
}));

// GET /courses/:id
app.get('/courses/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id оң бүтін сан болуы керек' });
  const course = await Course.findByPk(id, { include: Teacher });
  if (!course) return res.status(404).json({ error: 'Курс табылмады' });
  res.status(200).json(course);
}));

// POST /courses
app.post('/courses', wrap(async (req, res) => {
  const errors = validateCourse(req.body, false);
  if (errors.length) return res.status(400).json({ errors });
  const teacher = await Teacher.findByPk(req.body.teacherId);
  if (!teacher) return res.status(404).json({ error: 'Оқытушы табылмады' });
  const { title, description, hours, teacherId } = req.body;
  const course = await Course.create({ title: title.trim(), description, hours, teacherId });
  res.status(201).json(course);
}));

// PUT /courses/:id
app.put('/courses/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id оң бүтін сан болуы керек' });
  const errors = validateCourse(req.body, true);
  if (errors.length) return res.status(400).json({ errors });
  const course = await Course.findByPk(id);
  if (!course) return res.status(404).json({ error: 'Курс табылмады' });
  if (req.body.teacherId !== undefined && !(await Teacher.findByPk(req.body.teacherId))) {
    return res.status(404).json({ error: 'Оқытушы табылмады' });
  }
  const { title, description, hours, teacherId } = req.body;
  await course.update({ title: title?.trim(), description, hours, teacherId });
  res.status(200).json(course);
}));

// DELETE /courses/:id (жазылулар ON DELETE CASCADE арқылы өшеді)
app.delete('/courses/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id оң бүтін сан болуы керек' });
  const deleted = await Course.destroy({ where: { id } });
  if (!deleted) return res.status(404).json({ error: 'Курс табылмады' });
  res.status(200).json({ message: 'Курс жойылды', id });
}));

// POST /enrollments - студентті курсқа жазу
app.post('/enrollments', wrap(async (req, res) => {
  const { studentId, courseId, grade } = req.body || {};
  const errors = [];
  if (!isInt(studentId)) errors.push('studentId: оң бүтін сан болуы керек');
  if (!isInt(courseId)) errors.push('courseId: оң бүтін сан болуы керек');
  if (grade !== undefined && grade !== null && !(Number.isInteger(grade) && grade >= 0 && grade <= 100)) {
    errors.push('grade: 0-ден 100-ге дейінгі бүтін сан болуы керек');
  }
  if (errors.length) return res.status(400).json({ errors });

  if (!(await Student.findByPk(studentId))) return res.status(404).json({ error: 'Студент табылмады' });
  if (!(await Course.findByPk(courseId))) return res.status(404).json({ error: 'Курс табылмады' });
  if (await Enrollment.findOne({ where: { studentId, courseId } })) {
    return res.status(409).json({ error: 'Студент бұл курсқа бұрыннан жазылған' });
  }
  const enrollment = await Enrollment.create({ studentId, courseId, grade: grade ?? null });
  res.status(201).json(enrollment);
}));

// GET /students/:id/courses
app.get('/students/:id/courses', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ error: 'id оң бүтін сан болуы керек' });
  const student = await Student.findByPk(id, {
    include: { model: Course, include: Teacher },
    order: [[Course, 'id', 'ASC']]
  });
  if (!student) return res.status(404).json({ error: 'Студент табылмады' });
  res.status(200).json(student);
}));

// Ортақ қате өңдеушісі
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON қате форматта' });
  if (err instanceof UniqueConstraintError) return res.status(409).json({ error: 'Бірегей мән қайталанды' });
  if (err instanceof ForeignKeyConstraintError) return res.status(409).json({ error: 'Байланысты жазбалар бар' });
  if (err instanceof ValidationError) return res.status(400).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Сервер қатесі' });
});

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`http://localhost:${port}/courses`));
}

module.exports = app;
