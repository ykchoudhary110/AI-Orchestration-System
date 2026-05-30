import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Students
  getStudents: async () => {
    const res = await client.get('/students');
    return res.data;
  },
  getStudent: async (id) => {
    const res = await client.get(`/students/${id}`);
    return res.data;
  },
  createStudent: async (data) => {
    const res = await client.post('/students', data);
    return res.data;
  },
  updateStudent: async (id, data) => {
    const res = await client.put(`/students/${id}`, data);
    return res.data;
  },
  deleteStudent: async (id) => {
    const res = await client.delete(`/students/${id}`);
    return res.data;
  },

  // Questions
  getQuestions: async (params = {}) => {
    const res = await client.get('/questions', { params });
    return res.data;
  },
  createQuestion: async (data) => {
    const res = await client.post('/questions', data);
    return res.data;
  },

  // Assessments Adaptive Engine
  startAssessment: async (studentId, subject) => {
    const res = await client.post('/assessments/start', {
      student_id: studentId,
      subject,
    });
    return res.data;
  },
  nextQuestion: async (assessmentId, lastQuestionId, studentResponse, responseTimeSeconds) => {
    const res = await client.post('/assessments/next-question', {
      assessment_id: assessmentId,
      last_question_id: lastQuestionId,
      student_response: studentResponse,
      response_time_seconds: responseTimeSeconds,
    });
    return res.data;
  },
  submitAssessment: async (assessmentId, durationSeconds) => {
    const res = await client.post('/assessments/submit', {
      assessment_id: assessmentId,
      duration_seconds: durationSeconds,
    });
    return res.data;
  },
  evaluateVoice: async (studentId, expectedText, spokenText, durationSeconds) => {
    const res = await client.post('/assessments/voice-eval', {
      student_id: studentId,
      expected_text: expectedText,
      spoken_text: spokenText,
      duration_seconds: durationSeconds,
    });
    return res.data;
  },

  // Dashboard Metrics
  getDashboardStats: async () => {
    const res = await client.get('/dashboard/stats');
    return res.data;
  },
  getHeatmapData: async () => {
    const res = await client.get('/dashboard/heatmap');
    return res.data;
  },
  getGapDistribution: async () => {
    const res = await client.get('/dashboard/gap-chart');
    return res.data;
  },

  // AI Reporting
  getRecommendations: async (studentId) => {
    const res = await client.get(`/ai/recommendations/${studentId}`);
    return res.data;
  },
  getClassSummary: async (grade) => {
    const res = await client.post(`/ai/class-summary?grade=${grade}`);
    return res.data;
  },
};
