// Mock API Client for Frontend-Only Clickable Prototype
// Uses localStorage to persist student, teacher, school, question, and assessment records.

const defaultSchools = [
  { id: 1, name: 'GPS Block A', location: 'New Delhi' },
  { id: 2, name: 'Central Primary Academy', location: 'Mumbai' },
  { id: 3, name: 'Vivekananda Primary School', location: 'Kolkata' },
];

const defaultTeachers = [
  { id: 1, name: 'Rajesh Kumar', email: 'rajesh@fln.gov.in', school_id: 1 },
  { id: 2, name: 'Sunita Sharma', email: 'sunita@fln.gov.in', school_id: 2 },
  { id: 3, name: 'Anjali Patil', email: 'anjali@fln.gov.in', school_id: 3 },
];

const defaultStudents = [
  {
    id: 1,
    name: 'Aarav Mehta',
    age: 7,
    grade: 2,
    gender: 'M',
    school_id: 1,
    school: 'GPS Block A',
    teacher_id: 1,
    teacher: 'Rajesh Kumar',
    language: 'English',
    literacy_level: 'Grade 2',
    numeracy_level: 'Grade 2',
    competency_scores: [
      { competency: 'dictation', score: 85 },
      { competency: 'sentence_reading', score: 90 },
      { competency: 'comprehension', score: 80 },
      { competency: 'number_recognition', score: 95 },
      { competency: 'addition', score: 90 },
      { competency: 'subtraction', score: 85 },
      { competency: 'counting', score: 92 },
      { competency: 'number_sense', score: 88 },
      { competency: 'multiplication', score: 20 }
    ],
    risk_level: { risk_level: 'LOW', details: 'Performing well in both language and math.' },
    learning_gap: { gap_years: 0.2, actual_level: 1.8 },
    progress_history: [
      { id: 101, date: '2026-01-10T10:00:00Z', score: 20 },
      { id: 102, date: '2026-02-12T11:00:00Z', score: 35 },
      { id: 103, date: '2026-03-15T09:00:00Z', score: 55 },
      { id: 104, date: '2026-04-18T10:30:00Z', score: 70 },
      { id: 105, date: '2026-05-20T10:00:00Z', score: 85 }
    ]
  },
  {
    id: 2,
    name: 'Dia Deshmukh',
    age: 8,
    grade: 3,
    gender: 'F',
    school_id: 2,
    school: 'Central Primary Academy',
    teacher_id: 2,
    teacher: 'Sunita Sharma',
    language: 'Hindi',
    literacy_level: 'Grade 1',
    numeracy_level: 'Grade 1',
    competency_scores: [
      { competency: 'dictation', score: 45 },
      { competency: 'sentence_reading', score: 50 },
      { competency: 'comprehension', score: 30 },
      { competency: 'number_recognition', score: 60 },
      { competency: 'addition', score: 55 },
      { competency: 'subtraction', score: 40 },
      { competency: 'counting', score: 65 },
      { competency: 'number_sense', score: 50 },
      { competency: 'multiplication', score: 10 }
    ],
    risk_level: { risk_level: 'HIGH', details: 'Struggling with reading comprehension and subtraction.' },
    learning_gap: { gap_years: 1.8, actual_level: 1.2 },
    progress_history: [
      { id: 201, date: '2026-01-10T10:00:00Z', score: 15 },
      { id: 202, date: '2026-02-12T11:00:00Z', score: 25 },
      { id: 203, date: '2026-03-15T09:00:00Z', score: 30 },
      { id: 204, date: '2026-04-18T10:30:00Z', score: 42 },
      { id: 205, date: '2026-05-20T10:00:00Z', score: 45 }
    ]
  },
  {
    id: 3,
    name: 'Kabir Joshi',
    age: 6,
    grade: 1,
    gender: 'M',
    school_id: 1,
    school: 'GPS Block A',
    teacher_id: 1,
    teacher: 'Rajesh Kumar',
    language: 'English',
    literacy_level: 'Pre-Primary',
    numeracy_level: 'Grade 1',
    competency_scores: [
      { competency: 'dictation', score: 60 },
      { competency: 'sentence_reading', score: 55 },
      { competency: 'comprehension', score: 50 },
      { competency: 'number_recognition', score: 70 },
      { competency: 'addition', score: 65 },
      { competency: 'subtraction', score: 50 },
      { competency: 'counting', score: 72 },
      { competency: 'number_sense', score: 68 },
      { competency: 'multiplication', score: 5 }
    ],
    risk_level: { risk_level: 'MEDIUM', details: 'Moderately progressing, needs letter reading reinforcement.' },
    learning_gap: { gap_years: 1.1, actual_level: 0.9 },
    progress_history: [
      { id: 301, date: '2026-01-10T10:00:00Z', score: 30 },
      { id: 302, date: '2026-02-12T11:00:00Z', score: 40 },
      { id: 303, date: '2026-03-15T09:00:00Z', score: 50 },
      { id: 304, date: '2026-04-18T10:30:00Z', score: 58 },
      { id: 305, date: '2026-05-20T10:00:00Z', score: 60 }
    ]
  },
  {
    id: 4,
    name: 'Ananya Sen',
    age: 9,
    grade: 4,
    gender: 'F',
    school_id: 3,
    school: 'Vivekananda Primary School',
    teacher_id: 3,
    teacher: 'Anjali Patil',
    language: 'English',
    literacy_level: 'Grade 4',
    numeracy_level: 'Grade 4',
    competency_scores: [
      { competency: 'dictation', score: 95 },
      { competency: 'sentence_reading', score: 98 },
      { competency: 'comprehension', score: 95 },
      { competency: 'number_recognition', score: 98 },
      { competency: 'addition', score: 96 },
      { competency: 'subtraction', score: 94 },
      { competency: 'counting', score: 98 },
      { competency: 'number_sense', score: 95 },
      { competency: 'multiplication', score: 90 }
    ],
    risk_level: { risk_level: 'LOW', details: 'Excellent mastery. Exceeds standard benchmarks.' },
    learning_gap: { gap_years: 0.0, actual_level: 4.0 },
    progress_history: [
      { id: 401, date: '2026-01-10T10:00:00Z', score: 75 },
      { id: 402, date: '2026-02-12T11:00:00Z', score: 82 },
      { id: 403, date: '2026-03-15T09:00:00Z', score: 88 },
      { id: 404, date: '2026-04-18T10:30:00Z', score: 92 },
      { id: 405, date: '2026-05-20T10:00:00Z', score: 96 }
    ]
  },
  {
    id: 5,
    name: 'Rohan Gupta',
    age: 8,
    grade: 3,
    gender: 'M',
    school_id: 1,
    school: 'GPS Block A',
    teacher_id: 1,
    teacher: 'Rajesh Kumar',
    language: 'Hindi',
    literacy_level: 'Grade 1',
    numeracy_level: 'Grade 1',
    competency_scores: [
      { competency: 'dictation', score: 35 },
      { competency: 'sentence_reading', score: 40 },
      { competency: 'comprehension', score: 25 },
      { competency: 'number_recognition', score: 50 },
      { competency: 'addition', score: 45 },
      { competency: 'subtraction', score: 30 },
      { competency: 'counting', score: 55 },
      { competency: 'number_sense', score: 42 },
      { competency: 'multiplication', score: 0 }
    ],
    risk_level: { risk_level: 'HIGH', details: 'Substantial learning gaps in numeracy sense and reading.' },
    learning_gap: { gap_years: 2.2, actual_level: 0.8 },
    progress_history: [
      { id: 501, date: '2026-01-10T10:00:00Z', score: 10 },
      { id: 502, date: '2026-02-12T11:00:00Z', score: 18 },
      { id: 503, date: '2026-03-15T09:00:00Z', score: 22 },
      { id: 504, date: '2026-04-18T10:30:00Z', score: 30 },
      { id: 505, date: '2026-05-20T10:00:00Z', score: 38 }
    ]
  }
];

const defaultQuestions = [
  // Literacy English
  { id: 1, subject: 'literacy', competency: 'dictation', difficulty: 1, grade_level: 1, text: 'Listen and type the word: apple', correct_answer: 'apple', options: null, language: 'English', question_type: 'Dictation', is_active: true },
  { id: 2, subject: 'literacy', competency: 'dictation', difficulty: 2, grade_level: 2, text: 'Listen and type the word: garden', correct_answer: 'garden', options: null, language: 'English', question_type: 'Dictation', is_active: true },
  { id: 3, subject: 'literacy', competency: 'dictation', difficulty: 3, grade_level: 3, text: 'Listen and type the word: elephant', correct_answer: 'elephant', options: null, language: 'English', question_type: 'Dictation', is_active: true },
  
  { id: 4, subject: 'literacy', competency: 'sentence_reading', difficulty: 1, grade_level: 1, text: 'Read aloud: A red ball.', correct_answer: 'A red ball.', options: null, language: 'English', question_type: 'Reading', is_active: true },
  { id: 5, subject: 'literacy', competency: 'sentence_reading', difficulty: 2, grade_level: 2, text: 'Read aloud: The cat sat on the mat.', correct_answer: 'The cat sat on the mat.', options: null, language: 'English', question_type: 'Reading', is_active: true },
  { id: 6, subject: 'literacy', competency: 'sentence_reading', difficulty: 3, grade_level: 3, text: 'Read aloud: Priya has a little white dog named Spot.', correct_answer: 'Priya has a little white dog named Spot.', options: null, language: 'English', question_type: 'Reading', is_active: true },

  { id: 7, subject: 'literacy', competency: 'comprehension', difficulty: 2, grade_level: 2, text: 'Read and answer: Tim lost his toy car. He looked under the bed but it was not there. He found it in the toy box. Question: Where did Tim find his toy car?', correct_answer: 'toy box', options: '["under the bed", "toy box", "in the garden"]', language: 'English', question_type: 'MCQ', is_active: true },
  
  // Literacy Hindi
  { id: 8, subject: 'literacy', competency: 'dictation', difficulty: 1, grade_level: 1, text: 'Listen and type the word: फल', correct_answer: 'फल', options: null, language: 'Hindi', question_type: 'Dictation', is_active: true },
  { id: 9, subject: 'literacy', competency: 'dictation', difficulty: 2, grade_level: 2, text: 'Listen and type the word: सूरज', correct_answer: 'सूरज', options: null, language: 'Hindi', question_type: 'Dictation', is_active: true },
  { id: 10, subject: 'literacy', competency: 'sentence_reading', difficulty: 1, grade_level: 1, text: 'Read aloud: घर चल।', correct_answer: 'घर चल।', options: null, language: 'Hindi', question_type: 'Reading', is_active: true },
  { id: 11, subject: 'literacy', competency: 'sentence_reading', difficulty: 2, grade_level: 2, text: 'Read aloud: घर चल कर फल खा।', correct_answer: 'घर चल कर फल खा।', options: null, language: 'Hindi', question_type: 'Reading', is_active: true },

  // Numeracy
  { id: 12, subject: 'numeracy', competency: 'number_recognition', difficulty: 1, grade_level: 1, text: 'Identify the number: 7', correct_answer: '7', options: '["5", "7", "9"]', language: 'English', question_type: 'MCQ', is_active: true },
  { id: 13, subject: 'numeracy', competency: 'number_recognition', difficulty: 2, grade_level: 2, text: 'Identify the number: 45', correct_answer: '45', options: '["40", "45", "54"]', language: 'English', question_type: 'MCQ', is_active: true },
  { id: 14, subject: 'numeracy', competency: 'counting', difficulty: 1, grade_level: 1, text: 'How many stars are there? 🌟🌟🌟🌟🌟', correct_answer: '5', options: '["4", "5", "6"]', language: 'English', question_type: 'MCQ', is_active: true },
  { id: 15, subject: 'numeracy', competency: 'addition', difficulty: 1, grade_level: 1, text: 'Solve: 5 + 3 = ?', correct_answer: '8', options: '["7", "8", "9"]', language: 'English', question_type: 'MCQ', is_active: true },
  { id: 16, subject: 'numeracy', competency: 'addition', difficulty: 2, grade_level: 2, text: 'Solve: 14 + 7 = ?', correct_answer: '21', options: '["20", "21", "22"]', language: 'English', question_type: 'MCQ', is_active: true },
  { id: 17, subject: 'numeracy', competency: 'subtraction', difficulty: 2, grade_level: 2, text: 'Solve: 15 - 6 = ?', correct_answer: '9', options: '["8", "9", "10"]', language: 'English', question_type: 'MCQ', is_active: true },
  { id: 18, subject: 'numeracy', competency: 'subtraction', difficulty: 3, grade_level: 3, text: 'Solve: 35 - 18 = ?', correct_answer: '17', options: '["15", "17", "18"]', language: 'English', question_type: 'MCQ', is_active: true },
];

const defaultAssessments = [
  {
    id: 101,
    student_id: 1,
    subject: 'literacy',
    score: 85,
    questions_attempted: 5,
    correct_answers: 4,
    duration_seconds: 112,
    date: '2026-05-20',
    learning_gap: 0.2,
    actual_level: 'Grade 2',
    risk_level: 'LOW',
    responses: [
      { id: 1001, question_id: 1, question_text: 'Listen and type the word: apple', question_correct_answer: 'apple', student_response: 'apple', is_correct: true, competency: 'dictation', difficulty: 1, grade_level: 1 },
      { id: 1002, question_id: 2, question_text: 'Listen and type the word: garden', question_correct_answer: 'garden', student_response: 'garden', is_correct: true, competency: 'dictation', difficulty: 2, grade_level: 2 },
      { id: 1003, question_id: 5, question_text: 'Read aloud: The cat sat on the mat.', question_correct_answer: 'The cat sat on the mat.', student_response: 'The cat sat on the mat.', is_correct: true, competency: 'sentence_reading', difficulty: 2, grade_level: 2, audio_url: '/static/audio/student_1_q_28_1780374623.webm', accuracy_score: 95, pronunciation_score: 92, fluency_score: 88, wpm: 85, skipped_words: [], wrong_words: [] },
      { id: 1004, question_id: 7, question_text: 'Read and answer: Tim lost his toy car. Where did he find it?', question_correct_answer: 'toy box', student_response: 'toy box', is_correct: true, competency: 'comprehension', difficulty: 2, grade_level: 2 },
      { id: 1005, question_id: 3, question_text: 'Listen and type the word: elephant', question_correct_answer: 'elephant', student_response: 'elefent', is_correct: false, competency: 'dictation', difficulty: 3, grade_level: 3 }
    ]
  }
];

const initLocalStorage = () => {
  if (!localStorage.getItem('fln_students')) {
    localStorage.setItem('fln_students', JSON.stringify(defaultStudents));
  }
  if (!localStorage.getItem('fln_schools')) {
    localStorage.setItem('fln_schools', JSON.stringify(defaultSchools));
  }
  if (!localStorage.getItem('fln_teachers')) {
    localStorage.setItem('fln_teachers', JSON.stringify(defaultTeachers));
  }
  if (!localStorage.getItem('fln_questions')) {
    localStorage.setItem('fln_questions', JSON.stringify(defaultQuestions));
  }
  if (!localStorage.getItem('fln_assessments')) {
    localStorage.setItem('fln_assessments', JSON.stringify(defaultAssessments));
  }
};

const getStudentsList = () => {
  initLocalStorage();
  return JSON.parse(localStorage.getItem('fln_students'));
};

const saveStudentsList = (list) => {
  localStorage.setItem('fln_students', JSON.stringify(list));
};

const getSchoolsList = () => {
  initLocalStorage();
  return JSON.parse(localStorage.getItem('fln_schools'));
};

const saveSchoolsList = (list) => {
  localStorage.setItem('fln_schools', JSON.stringify(list));
};

const getTeachersList = () => {
  initLocalStorage();
  return JSON.parse(localStorage.getItem('fln_teachers'));
};

const saveTeachersList = (list) => {
  localStorage.setItem('fln_teachers', JSON.stringify(list));
};

const getQuestionsList = () => {
  initLocalStorage();
  return JSON.parse(localStorage.getItem('fln_questions'));
};

const saveQuestionsList = (list) => {
  localStorage.setItem('fln_questions', JSON.stringify(list));
};

const getAssessmentsList = () => {
  initLocalStorage();
  return JSON.parse(localStorage.getItem('fln_assessments'));
};

const saveAssessmentsList = (list) => {
  localStorage.setItem('fln_assessments', JSON.stringify(list));
};

// Simulate async response delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Students
  getStudents: async () => {
    await delay();
    return getStudentsList();
  },
  getStudent: async (id) => {
    await delay();
    const students = getStudentsList();
    return students.find(s => s.id === parseInt(id)) || null;
  },
  getStudentAssessments: async (studentId) => {
    await delay();
    const assessments = getAssessmentsList();
    return assessments.filter(a => a.student_id === parseInt(studentId));
  },
  createStudent: async (data) => {
    await delay();
    const students = getStudentsList();
    const schools = getSchoolsList();
    const teachers = getTeachersList();
    
    const matchedSchool = schools.find(s => s.id === parseInt(data.school_id))?.name || 'GPS Block A';
    const matchedTeacher = teachers.find(t => t.id === parseInt(data.teacher_id))?.name || 'Rajesh Kumar';

    const newId = students.length > 0 ? Math.max(...students.map(s => s.id)) + 1 : 1;
    const newStudent = {
      id: newId,
      name: data.name,
      age: parseInt(data.age) || 8,
      grade: parseInt(data.grade) || 2,
      gender: data.gender || 'M',
      school_id: parseInt(data.school_id) || 1,
      school: matchedSchool,
      teacher_id: parseInt(data.teacher_id) || 1,
      teacher: matchedTeacher,
      language: data.language || 'English',
      literacy_level: 'Grade 1',
      numeracy_level: 'Grade 1',
      competency_scores: [
        { competency: 'dictation', score: 50 },
        { competency: 'sentence_reading', score: 50 },
        { competency: 'comprehension', score: 50 },
        { competency: 'number_recognition', score: 50 },
        { competency: 'addition', score: 50 },
        { competency: 'subtraction', score: 50 },
        { competency: 'counting', score: 50 },
        { competency: 'number_sense', score: 50 }
      ],
      risk_level: { risk_level: 'MEDIUM', details: 'Not assessed yet.' },
      learning_gap: { gap_years: 1.0, actual_level: (parseInt(data.grade) - 1.0) || 1.0 },
      progress_history: [
        { id: Date.now(), date: new Date().toISOString(), score: 50 }
      ]
    };
    
    students.push(newStudent);
    saveStudentsList(students);
    return newStudent;
  },
  updateStudent: async (id, data) => {
    await delay();
    const students = getStudentsList();
    const index = students.findIndex(s => s.id === parseInt(id));
    if (index === -1) throw new Error('Student not found');
    
    students[index] = { ...students[index], ...data };
    saveStudentsList(students);
    return students[index];
  },
  deleteStudent: async (id) => {
    await delay();
    const students = getStudentsList();
    const filtered = students.filter(s => s.id !== parseInt(id));
    saveStudentsList(filtered);
    return { success: true };
  },

  // Bulk Student Upload
  importStudents: async (file, schoolId = '', teacherId = '') => {
    await delay(1200);
    const students = getStudentsList();
    const schools = getSchoolsList();
    const teachers = getTeachersList();

    const targetSchool = schools.find(s => s.id === parseInt(schoolId))?.name || 'GPS Block A';
    const targetTeacher = teachers.find(t => t.id === parseInt(teacherId))?.name || 'Rajesh Kumar';

    // Simulate bulk adding 3 default students
    const dummyNames = ['Vihaan Nair', 'Kavya Rao', 'Sai Deshpande'];
    const newStudents = dummyNames.map((name, index) => {
      const newId = Math.max(...students.map(s => s.id)) + 1 + index;
      return {
        id: newId,
        name,
        age: 7 + index,
        grade: 2,
        gender: index % 2 === 0 ? 'M' : 'F',
        school_id: parseInt(schoolId) || 1,
        school: targetSchool,
        teacher_id: parseInt(teacherId) || 1,
        teacher: targetTeacher,
        language: 'English',
        literacy_level: 'Grade 2',
        numeracy_level: 'Grade 2',
        competency_scores: [
          { competency: 'dictation', score: 70 },
          { competency: 'sentence_reading', score: 75 },
          { competency: 'comprehension', score: 65 },
          { competency: 'number_recognition', score: 80 },
          { competency: 'addition', score: 75 },
          { competency: 'subtraction', score: 70 },
          { competency: 'counting', score: 82 },
          { competency: 'number_sense', score: 78 }
        ],
        risk_level: { risk_level: 'LOW', details: 'Imported from student spreadsheet registry.' },
        learning_gap: { gap_years: 0.5, actual_level: 1.5 },
        progress_history: [
          { id: Date.now() + index, date: new Date().toISOString(), score: 75 }
        ]
      };
    });

    saveStudentsList([...students, ...newStudents]);

    return {
      summary: {
        total_processed: 3,
        success_count: 3,
        duplicate_count: 0,
        error_count: 0
      }
    };
  },

  // Schools CRUD
  getSchools: async () => {
    await delay();
    return getSchoolsList();
  },
  createSchool: async (data) => {
    await delay();
    const schools = getSchoolsList();
    const newId = schools.length > 0 ? Math.max(...schools.map(s => s.id)) + 1 : 1;
    const newSchool = { id: newId, name: data.name, location: data.location || 'Unknown' };
    schools.push(newSchool);
    saveSchoolsList(schools);
    return newSchool;
  },
  deleteSchool: async (id) => {
    await delay();
    const schools = getSchoolsList();
    const filtered = schools.filter(s => s.id !== parseInt(id));
    saveSchoolsList(filtered);
    return { success: true };
  },

  // Teachers CRUD
  getTeachers: async () => {
    await delay();
    return getTeachersList();
  },
  createTeacher: async (data) => {
    await delay();
    const teachers = getTeachersList();
    const newId = teachers.length > 0 ? Math.max(...teachers.map(t => t.id)) + 1 : 1;
    const newTeacher = {
      id: newId,
      name: data.name,
      email: data.email || `${data.name.toLowerCase().replace(/\s+/g, '')}@fln.gov.in`,
      school_id: parseInt(data.school_id) || 1
    };
    teachers.push(newTeacher);
    saveTeachersList(teachers);
    return newTeacher;
  },
  deleteTeacher: async (id) => {
    await delay();
    const teachers = getTeachersList();
    const filtered = teachers.filter(t => t.id !== parseInt(id));
    saveTeachersList(filtered);
    return { success: true };
  },

  // Questions
  getQuestions: async (params = {}) => {
    await delay();
    let questions = getQuestionsList();
    if (params.subject) {
      questions = questions.filter(q => q.subject === params.subject);
    }
    if (params.language) {
      questions = questions.filter(q => q.language === params.language);
    }
    if (params.grade_level) {
      questions = questions.filter(q => q.grade_level === parseInt(params.grade_level));
    }
    return questions;
  },
  createQuestion: async (data) => {
    await delay();
    const questions = getQuestionsList();
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const newQuestion = {
      id: newId,
      subject: data.subject,
      competency: data.competency,
      difficulty: parseInt(data.difficulty) || 1,
      grade_level: parseInt(data.grade_level) || 1,
      text: data.text,
      options: data.options || null,
      correct_answer: data.correct_answer,
      language: data.language || 'English',
      question_type: data.question_type || 'MCQ',
      is_active: true
    };
    questions.push(newQuestion);
    saveQuestionsList(questions);
    return newQuestion;
  },
  updateQuestion: async (id, data) => {
    await delay();
    const questions = getQuestionsList();
    const index = questions.findIndex(q => q.id === parseInt(id));
    if (index === -1) throw new Error('Question not found');
    questions[index] = { ...questions[index], ...data };
    saveQuestionsList(questions);
    return questions[index];
  },
  toggleQuestionStatus: async (id, isActive) => {
    await delay();
    const questions = getQuestionsList();
    const index = questions.findIndex(q => q.id === parseInt(id));
    if (index !== -1) {
      questions[index].is_active = isActive;
      saveQuestionsList(questions);
    }
    return { success: true };
  },
  deleteQuestion: async (id) => {
    await delay();
    const questions = getQuestionsList();
    const filtered = questions.filter(q => q.id !== parseInt(id));
    saveQuestionsList(filtered);
    return { success: true };
  },
  importQuestions: async (questionsList) => {
    await delay();
    const questions = getQuestionsList();
    questionsList.forEach((q, index) => {
      const newId = Math.max(...questions.map(qs => qs.id)) + 1 + index;
      questions.push({ ...q, id: newId, is_active: true });
    });
    saveQuestionsList(questions);
    return { success: true };
  },

  // AI Question Generator (Rule-based Offline simulation)
  generateQuestionAI: async (data) => {
    await delay(1200);
    const { subject, competency, difficulty, grade_level, language } = data;
    
    if (subject === 'literacy') {
      if (competency === 'dictation') {
        const enWords = ['backpack', 'notebook', 'umbrella', 'rainbow', 'butterfly'];
        const hiWords = ['किताब', 'पेड़', 'खिलौना', 'स्याही', 'गुब्बारा'];
        const wordList = language === 'Hindi' ? hiWords : enWords;
        const targetWord = wordList[Math.min(difficulty - 1, wordList.length - 1)];
        return {
          text: language === 'Hindi' 
            ? `सुनें और शब्द टाइप करें: [${targetWord}]`
            : `Listen and type the word: [${targetWord}]`,
          correct_answer: targetWord,
          options: null,
          question_type: 'Dictation'
        };
      } else if (competency === 'sentence_reading') {
        const enSentences = [
          'The sky is blue.',
          'Birds love flying high.',
          'Priya reads a thick book under the oak tree.',
          'Environmental conservation is essential for local communities.',
          'Adaptive algorithms dynamically evaluate foundational cognitive markers.'
        ];
        const hiSentences = [
          'नल पर चल।',
          'सूरज पूरब से निकलता है।',
          'प्रिया आम के पेड़ के नीचे किताब पढ़ती है।',
          'वर्षा जल संचयन हमारे भविष्य के लिए बहुत आवश्यक है।',
          'प्राथमिक शिक्षा ही बच्चे के संज्ञानात्मक विकास की मजबूत नींव रखती है।'
        ];
        const sentenceList = language === 'Hindi' ? hiSentences : enSentences;
        const targetSentence = sentenceList[Math.min(difficulty - 1, sentenceList.length - 1)];
        return {
          text: targetSentence,
          correct_answer: targetSentence,
          options: null,
          question_type: 'Reading'
        };
      } else {
        // Comprehension MCQ
        return {
          text: 'Read and answer: Tim has a tiny red bicycle. He rides it to the garden. Tim loves looking at the yellow roses. Question: What color is Tim\'s bicycle?',
          correct_answer: 'red',
          options: JSON.stringify(['blue', 'red', 'yellow']),
          question_type: 'MCQ'
        };
      }
    } else {
      // Numeracy Simulation
      const num1 = difficulty * 4;
      const num2 = difficulty * 2;
      
      if (competency === 'addition') {
        return {
          text: `Solve the addition: ${num1} + ${num2} = ?`,
          correct_answer: `${num1 + num2}`,
          options: JSON.stringify([`${num1 + num2 - 2}`, `${num1 + num2}`, `${num1 + num2 + 3}`]),
          question_type: 'MCQ'
        };
      } else if (competency === 'subtraction') {
        const largeNum = num1 + num2 + 5;
        return {
          text: `Solve the subtraction: ${largeNum} - ${num2} = ?`,
          correct_answer: `${largeNum - num2}`,
          options: JSON.stringify([`${largeNum - num2}`, `${largeNum - num2 + 2}`, `${largeNum - num2 - 1}`]),
          question_type: 'MCQ'
        };
      } else {
        return {
          text: `Identify the place value of ${num1} in ${num1}5`,
          correct_answer: 'tens',
          options: JSON.stringify(['ones', 'tens', 'hundreds']),
          question_type: 'MCQ'
        };
      }
    }
  },

  // Assessments Adaptive Engine
  startAssessment: async (studentId, subject) => {
    await delay();
    const students = getStudentsList();
    const student = students.find(s => s.id === parseInt(studentId));
    if (!student) throw new Error('Student not found');

    const allQuestions = getQuestionsList().filter(
      q => q.subject === subject && q.language === student.language && q.is_active
    );
    
    // Fallback to English questions if no language matches
    const questions = allQuestions.length > 0 
      ? allQuestions 
      : getQuestionsList().filter(q => q.subject === subject && q.is_active);

    // Arrange 5 adaptive simulated questions
    const selectedQuestions = questions.slice(0, 5);
    
    // Initialize active session
    const session = {
      assessment_id: `asm-${Date.now()}`,
      student_id: parseInt(studentId),
      subject,
      question_index: 0,
      questions: selectedQuestions,
      responses: []
    };
    
    localStorage.setItem('fln_active_session', JSON.stringify(session));

    return {
      assessment_id: session.assessment_id,
      first_question: selectedQuestions[0]
    };
  },

  nextQuestion: async (assessmentId, lastQuestionId, studentResponse, responseTimeSeconds) => {
    await delay();
    const session = JSON.parse(localStorage.getItem('fln_active_session'));
    if (!session || session.assessment_id !== assessmentId) throw new Error('Invalid assessment session');
    
    const idx = session.question_index;
    const currentQ = session.questions[idx];
    
    // Check correctness
    const isCorrect = studentResponse.trim().toLowerCase() === currentQ.correct_answer.trim().toLowerCase() ||
                      studentResponse.trim() === currentQ.correct_answer.trim();

    session.responses.push({
      id: `resp-${Date.now()}-${idx}`,
      question_id: currentQ.id,
      question_text: currentQ.text,
      question_correct_answer: currentQ.correct_answer,
      student_response: studentResponse,
      is_correct: isCorrect,
      competency: currentQ.competency,
      difficulty: currentQ.difficulty,
      grade_level: currentQ.grade_level,
      response_time_seconds: responseTimeSeconds,
      // Add voice evaluation details if reading assessment
      ...(currentQ.question_type === 'Reading' && {
        audio_url: studentResponse.startsWith('blob:') ? studentResponse : '/static/audio/student_1_q_28_1780374623.webm',
        accuracy_score: isCorrect ? 96 : 30,
        pronunciation_score: isCorrect ? 94 : 25,
        fluency_score: isCorrect ? 90 : 20,
        wpm: isCorrect ? 82 : 15,
        skipped_words: isCorrect ? [] : currentQ.correct_answer.split(' ').slice(1),
        wrong_words: isCorrect ? [] : [currentQ.correct_answer.split(' ')[0]]
      })
    });

    session.question_index += 1;
    localStorage.setItem('fln_active_session', JSON.stringify(session));

    if (session.question_index >= 5 || session.question_index >= session.questions.length) {
      return {
        finished: true,
        current_progress: session.question_index
      };
    } else {
      return {
        finished: false,
        next_question: session.questions[session.question_index],
        current_progress: session.question_index
      };
    }
  },

  submitAssessment: async (assessmentId, durationSeconds) => {
    await delay(500);
    const session = JSON.parse(localStorage.getItem('fln_active_session'));
    if (!session || session.assessment_id !== assessmentId) throw new Error('Invalid assessment session');
    
    const students = getStudentsList();
    const studentIdx = students.findIndex(s => s.id === session.student_id);
    if (studentIdx === -1) throw new Error('Student not found');
    const student = students[studentIdx];
    
    const totalQuestions = session.responses.length;
    const correctCount = session.responses.filter(r => r.is_correct).length;
    const pctScore = Math.round((correctCount / totalQuestions) * 100);

    // Save final stats
    let risk_level = 'LOW';
    let learning_gap = 0.2;
    if (pctScore < 50) {
      risk_level = 'HIGH';
      learning_gap = 1.8;
    } else if (pctScore < 80) {
      risk_level = 'MEDIUM';
      learning_gap = 1.1;
    }

    const actual_level = pctScore >= 80 
      ? `Grade ${student.grade}`
      : `Grade ${Math.max(1, student.grade - 1)}`;

    const newAssessmentRecord = {
      id: Date.now(),
      student_id: session.student_id,
      subject: session.subject,
      score: pctScore,
      questions_attempted: totalQuestions,
      correct_answers: correctCount,
      duration_seconds: durationSeconds,
      date: new Date().toISOString().split('T')[0],
      learning_gap,
      actual_level,
      risk_level,
      responses: session.responses
    };

    // Save assessment record
    const assessments = getAssessmentsList();
    assessments.unshift(newAssessmentRecord);
    saveAssessmentsList(assessments);

    // Update student's dynamic profiles
    student.risk_level = { risk_level, details: `Diagnosed on ${newAssessmentRecord.date}` };
    student.learning_gap = { gap_years: learning_gap, actual_level: pctScore >= 80 ? student.grade : Math.max(1, student.grade - 1) };
    
    // Update individual competency score averages
    session.responses.forEach(r => {
      const idx = student.competency_scores.findIndex(cs => cs.competency === r.competency);
      const inputScore = r.is_correct ? 95 : 30;
      if (idx !== -1) {
        student.competency_scores[idx].score = Math.round((student.competency_scores[idx].score + inputScore) / 2);
      } else {
        student.competency_scores.push({ competency: r.competency, score: inputScore });
      }
    });

    // Update progress history array
    student.progress_history = student.progress_history || [];
    student.progress_history.push({
      id: Date.now(),
      date: new Date().toISOString(),
      score: pctScore
    });

    students[studentIdx] = student;
    saveStudentsList(students);

    // Remove active session
    localStorage.removeItem('fln_active_session');

    return {
      score: pctScore,
      learning_gap: learning_gap,
      actual_level: actual_level,
      risk_level: risk_level,
      recommendation: {
        teacher: pctScore >= 80 
          ? 'Maintain standard core practice modules. Student is meeting expectation boundaries.' 
          : 'Execute 15-minute daily guided remedial loops. Focus on phonetic decoding and simple written patterns.',
        parent: pctScore >= 80 
          ? 'नियमित अध्ययन जारी रखें। छात्र का प्रदर्शन संतोषजनक है।' 
          : 'रोजाना १० मिनट बच्चे के साथ पढ़ने का अभ्यास करें। वाक्यों को जोर से बोलकर पढ़ने में मदद करें।'
      }
    };
  },

  evaluateVoice: async (studentId, expectedText, spokenText, durationSeconds) => {
    await delay();
    const cleanExp = expectedText.toLowerCase().replace(/[^\w\u0900-\u097F]/g, '');
    const cleanSpk = spokenText.toLowerCase().replace(/[^\w\u0900-\u097F]/g, '');
    const isCorrect = cleanExp === cleanSpk;
    
    return {
      expected_text: expectedText,
      spoken_text: spokenText,
      accuracy: isCorrect ? 100.0 : 40.0,
      words_per_minute: isCorrect ? 75.0 : 20.0,
      skipped_words: isCorrect ? [] : [expectedText.split(' ')[0]],
      wrong_words: [],
      reading_fluency: isCorrect ? 90.0 : 30.0,
      transcription_source: "Simulated Voice Evaluation Engine"
    };
  },

  uploadVoiceFile: async (studentId, expectedText, durationSeconds, file, assessmentId = '', questionId = '') => {
    await delay(1200);
    // Create an Object URL from the recorded blob file to play it back directly in browser
    const audioUrl = URL.createObjectURL(file);
    return {
      expected_text: expectedText,
      spoken_text: expectedText, // mock high accuracy for demonstration
      accuracy: 94.5,
      words_per_minute: 82,
      skipped_words: [],
      wrong_words: [],
      reading_fluency: 91.0,
      transcription_source: "Local Browser WebSpeech & Whisper Emulator",
      audio_url: audioUrl
    };
  },

  // Dashboard Metrics
  getDashboardStats: async () => {
    await delay();
    const students = getStudentsList();
    const highRisk = students.filter(s => s.risk_level?.risk_level === 'HIGH').length;
    const gaps = students.map(s => s.learning_gap?.gap_years || 0);
    const avgGap = gaps.length > 0 ? (gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(1) : 0.0;

    return {
      high_risk_count: highRisk,
      avg_learning_gap: parseFloat(avgGap)
    };
  },

  getHeatmapData: async () => {
    await delay();
    return [
      { competency: 'Dictation', G1: 65, G2: 85, G3: 40 },
      { competency: 'Sentence Reading', G1: 58, G2: 90, G3: 45 },
      { competency: 'Comprehension', G1: 50, G2: 80, G3: 30 },
      { competency: 'Number Recognition', G1: 82, G2: 95, G3: 58 },
      { competency: 'Addition', G1: 70, G2: 90, G3: 50 },
      { competency: 'Subtraction', G1: 55, G2: 85, G3: 35 },
    ];
  },

  getGapDistribution: async () => {
    await delay();
    const students = getStudentsList();
    const bins = { '0.0-0.5 yrs': 0, '0.6-1.0 yrs': 0, '1.1-1.5 yrs': 0, '1.6-2.0 yrs': 0, '2.0+ yrs': 0 };
    
    students.forEach(s => {
      const gap = s.learning_gap?.gap_years || 0;
      if (gap <= 0.5) bins['0.0-0.5 yrs']++;
      else if (gap <= 1.0) bins['0.6-1.0 yrs']++;
      else if (gap <= 1.5) bins['1.1-1.5 yrs']++;
      else if (gap <= 2.0) bins['1.6-2.0 yrs']++;
      else bins['2.0+ yrs']++;
    });

    return Object.keys(bins).map(range => ({
      range,
      students: bins[range]
    }));
  },

  // AI Reporting
  getRecommendations: async (studentId) => {
    await delay();
    const students = getStudentsList();
    const student = students.find(s => s.id === parseInt(studentId));
    if (!student) throw new Error('Student not found');
    
    // Sort scores to find the lowest competency
    const sorted = [...student.competency_scores].sort((a, b) => a.score - b.score);
    const weakComp = sorted.length > 0 ? sorted[0].competency : 'dictation';

    const mockRecs = {
      dictation: {
        competency: 'dictation',
        teacher_recommendation: 'Weak competency: Dictation.\n- Execute daily vocabulary writing loops for 10 minutes.\n- Provide sound-to-letter matching activities using bilingual words (English/Hindi).\n- Re-evaluate dictation index boundaries weekly.',
        parent_report: 'कमजोर कौशल: डिक्टेशन (श्रुतलेख)।\n- रोजाना १० मिनट बच्चों को अक्षरों और शब्दों को लिखकर अभ्यास करवाएं।\n- बोले गए शब्दों की स्पेलिंग (वर्तनी) लिखने में उनकी मदद करें।'
      },
      sentence_reading: {
        competency: 'sentence_reading',
        teacher_recommendation: 'Weak competency: Sentence Reading.\n- Initiate paired reading sessions using short Grade-appropriate books.\n- Reinforce multi-syllable word breakdowns and phonetic decoding.\n- Track read aloud accuracy metrics.',
        parent_report: 'कमजोर कौशल: वाक्य पढ़ना।\n- रोजाना बच्चे को छोटी कहानियां जोर से पढ़ने के लिए कहें।\n- पढ़ते समय गलतियों को टोकने के बजाय उन्हें शब्द को जोड़ने में मदद करें।'
      },
      comprehension: {
        competency: 'comprehension',
        teacher_recommendation: 'Weak competency: Reading Comprehension.\n- Ask targeted story outcome questions (Who, What, Where) during reading loops.\n- Emphasize context clues to extract text meaning.\n- Introduce pictorial storyboards to connect concepts.',
        parent_report: 'कमजोर कौशल: समझकर पढ़ना।\n- बच्चे को कहानी सुनाने के बाद पूछें कि कहानी में क्या हुआ था।\n- पात्रों और मुख्य घटनाओं के बारे में आसान सवाल पूछें।'
      },
      number_recognition: {
        competency: 'number_recognition',
        teacher_recommendation: 'Weak competency: Number Recognition.\n- Conduct flashcard drill loops focusing on 2-digit numbers.\n- Connect numbers to physical objects (counting blocks, beads).\n- Run number identifier games in play mode.',
        parent_report: 'कमजोर कौशल: संख्या पहचान।\n- बच्चे को रोजमर्रा की चीजों (जैसे अखबार, बस टिकट) पर नंबर पहचानने को कहें।\n- फ्लैशकार्ड के साथ नंबर गेम खेलें।'
      },
      addition: {
        competency: 'addition',
        teacher_recommendation: 'Weak competency: Addition calculations.\n- Utilize visual addition grids and physical block counting.\n- Practice single-digit additions, transitioning slowly to double digits with carryover.\n- Re-evaluate addition accuracy checks.',
        parent_report: 'कमजोर कौशल: जोड़ना।\n- घरेलू वस्तुओं (जैसे चम्मच, फल) को जोड़कर सिखाएं।\n- जोड़ के सरल गणितीय सवाल रोज हल करवाएं।'
      },
      subtraction: {
        competency: 'subtraction',
        teacher_recommendation: 'Weak competency: Subtraction calculations.\n- Use backward counting loops and block removals.\n- Break down multi-digit subtractions using pictorial representations.\n- Practice offline worksheets daily.',
        parent_report: 'कमजोर कौशल: घटाना।\n- वस्तुओं को अलग करके (जैसे ५ फलों में से २ हटाना) घटाव की प्रक्रिया सिखाएं।\n- खेल-खेल में घटाने के सवाल पूछें।'
      }
    };

    const targetRec = mockRecs[weakComp] || mockRecs.dictation;

    return {
      recommendations: [targetRec]
    };
  },

  getClassSummary: async (grade) => {
    await delay(1500);
    return {
      summary: `Class summary report generated for Grade ${grade}:
- Core Weak Competency: Reading Comprehension (40% class index mastery) and Subtraction math logic.
- Performance Index: GPS Block A shows a 1.2 years curriculum gap.
- Immediate action recommended: Scale daily 15-minute language intervention and visual subtraction block activities.`
    };
  }
};
