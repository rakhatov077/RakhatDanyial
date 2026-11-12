const { sequelize, Teacher, Student, Course, Enrollment } = require('./db');

(async () => {
  await sequelize.authenticate();
  console.log('Дерекқорға қосылды\n');

  // 1. Курстар оқытушыларымен (include)
  const courses = await Course.findAll({ include: Teacher, order: [['id', 'ASC']] });
  console.log('1) Курстар және оқытушылар:');
  courses.forEach(c => console.log(`   ${c.id}. ${c.title} (${c.hours} сағ.) - ${c.Teacher.fullName}`));

  // 2. Курс студенттері бағаларымен
  const course = await Course.findByPk(1, { include: Student });
  console.log(`\n2) «${course.title}» курсының студенттері:`);
  course.Students.forEach(s => console.log(`   ${s.fullName}: ${s.Enrollment.grade ?? 'баға жоқ'}`));

  // 3. Студент қосу және курсқа жазу
  const [student] = await Student.findOrCreate({
    where: { email: 'new.student@student.kz' },
    defaults: { fullName: 'Жаңа Студент', groupName: 'ИС-24' }
  });
  await Enrollment.findOrCreate({ where: { studentId: student.id, courseId: 1 } });
  console.log(`\n3) Студент қосылды: id=${student.id}, ${student.fullName}, курсқа жазылды`);

  // 4. Бағаны өзгерту
  await Enrollment.update({ grade: 90 }, { where: { studentId: student.id, courseId: 1 } });
  const e = await Enrollment.findOne({ where: { studentId: student.id, courseId: 1 } });
  console.log(`4) Баға қойылды: ${e.grade}`);

  // 5. Жазбаны жою (және тест студентін тазалау)
  await Enrollment.destroy({ where: { studentId: student.id, courseId: 1 } });
  await student.destroy();
  console.log('5) Жазба мен тест студенті жойылды');

  await sequelize.close();
})().catch(err => { console.error('Қате:', err.message); process.exit(1); });
