require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

// Neon үшін SSL қажет. Локалды PostgreSQL-де тексергенде DB_SSL=false қойыңыз.
const useSsl = process.env.DB_SSL !== 'false';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: useSsl ? { ssl: { require: true } } : {}
});

const opts = (tableName) => ({ tableName, underscored: true, timestamps: false });

const Teacher = sequelize.define('Teacher', {
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true }
}, opts('teachers'));

const Student = sequelize.define('Student', {
  fullName: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  groupName: { type: DataTypes.STRING, allowNull: false }
}, opts('students'));

const Course = sequelize.define('Course', {
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  hours: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  teacherId: { type: DataTypes.INTEGER, allowNull: false }
}, opts('courses'));

// Құрама бастапқы кілт (studentId, courseId)
const Enrollment = sequelize.define('Enrollment', {
  studentId: { type: DataTypes.INTEGER, primaryKey: true },
  courseId: { type: DataTypes.INTEGER, primaryKey: true },
  enrolledAt: { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
  grade: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0, max: 100 } }
}, opts('enrollments'));

// Бір оқытушы - көп курс
Teacher.hasMany(Course, { foreignKey: 'teacherId' });
Course.belongsTo(Teacher, { foreignKey: 'teacherId' });

// Студент <-> Курс (көптен көпке, Enrollment арқылы)
Student.belongsToMany(Course, { through: Enrollment, foreignKey: 'studentId', otherKey: 'courseId' });
Course.belongsToMany(Student, { through: Enrollment, foreignKey: 'courseId', otherKey: 'studentId' });

// Байланыстырушы кестеге тікелей қол жеткізу үшін (include: Enrollment)
Student.hasMany(Enrollment, { foreignKey: 'studentId' });
Enrollment.belongsTo(Student, { foreignKey: 'studentId' });
Course.hasMany(Enrollment, { foreignKey: 'courseId' });
Enrollment.belongsTo(Course, { foreignKey: 'courseId' });

module.exports = { sequelize, Teacher, Student, Course, Enrollment };
