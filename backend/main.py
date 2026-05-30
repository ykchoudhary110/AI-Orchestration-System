import os
import json
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database import Base, engine, SessionLocal
from backend.models.schemas import Student, Question, CompetencyScore, LearningGap, RiskLevel, ProgressHistory, Recommendation, Assessment
from backend.routes import students, questions, assessments, dashboard, ai

app = FastAPI(
    title="FLN Compass API",
    description="Offline-First Foundational Literacy & Numeracy Diagnostic Intelligence System Backend",
    version="1.0.0"
)

# CORS configurations for React/Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(students.router)
app.include_router(questions.router)
app.include_router(assessments.router)
app.include_router(dashboard.router)
app.include_router(ai.router)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "FLN Compass",
        "database": "SQLite",
        "ai_engine": "LM Studio (Gemma 3 4B Compatible)"
    }


# ==========================================
# Database Seeding on Startup
# ==========================================

def seed_database():
    db = SessionLocal()
    try:
        # Force refresh all tables for a clean, reproducible demo
        db.query(Question).delete()
        db.query(Student).delete()
        db.commit()
        
        # 1. Seed Questions
        if db.query(Question).count() == 0:
            print("[Seeding] Seeding question bank...")
            questions_to_seed = []
            
            # --- LITERACY (English and Hindi) ---
            # Letter Recognition (Now oral reading - options are None)
            for diff, letter in [(1, "A"), (2, "M"), (3, "H"), (4, "W"), (5, "Q")]:
                questions_to_seed.append(Question(
                    subject="literacy", competency="letter_recognition", difficulty=diff, grade_level=1,
                    text=f"Please read this letter aloud: [English] {letter}", correct_answer=letter, options=None
                ))
            for diff, letter in [(1, "अ"), (2, "क"), (3, "म"), (4, "श्र"), (5, "ज्ञ")]:
                questions_to_seed.append(Question(
                    subject="literacy", competency="letter_recognition", difficulty=diff, grade_level=1,
                    text=f"Please read this letter aloud: [Hindi] {letter}", correct_answer=letter, options=None
                ))

            # Phonics
            for diff, word in [(1, "Cat"), (2, "Shop"), (3, "Bland"), (4, "Flight"), (5, "Phonics")]:
                questions_to_seed.append(Question(
                    subject="literacy", competency="phonics", difficulty=diff, grade_level=1,
                    text=f"Read the phonics word: [English] {word}", correct_answer=word
                ))
            for diff, word in [(1, "कल"), (2, "घर"), (3, "सड़क"), (4, "मछली"), (5, "किताब")]:
                questions_to_seed.append(Question(
                    subject="literacy", competency="phonics", difficulty=diff, grade_level=1,
                    text=f"Read the phonics word: [Hindi] {word}", correct_answer=word
                ))

            # Word Reading
            for diff, word in [(1, "Sun"), (2, "Apple"), (3, "Garden"), (4, "Mountain"), (5, "Celebration")]:
                questions_to_seed.append(Question(
                    subject="literacy", competency="word_reading", difficulty=diff, grade_level=2,
                    text=f"Read the vocabulary word: [English] {word}", correct_answer=word
                ))
            for diff, word in [(1, "कमल"), (2, "सूरज"), (3, "दरवाजा"), (4, "विद्यालय"), (5, "प्रधानाचार्य")]:
                questions_to_seed.append(Question(
                    subject="literacy", competency="word_reading", difficulty=diff, grade_level=2,
                    text=f"Read the vocabulary word: [Hindi] {word}", correct_answer=word
                ))

            # Sentence Reading (These are read aloud by the student)
            sentences_eng = [
                (1, "The cat sat."),
                (2, "The boy is playing."),
                (3, "We go to school every morning."),
                (4, "Rainy days are perfect for reading stories."),
                (5, "Foundational learning builds the pathway to student success.")
            ]
            for diff, text in sentences_eng:
                questions_to_seed.append(Question(
                    subject="literacy", competency="sentence_reading", difficulty=diff, grade_level=3,
                    text=f"Read this sentence aloud: [English] {text}", correct_answer=text
                ))
            sentences_hin = [
                (1, "घर चल।"),
                (2, "राम फल खा।"),
                (3, "हम रोज पाठशाला जाते हैं।"),
                (4, "बरसात के मौसम में मोर नाचता है।"),
                (5, "प्राथमिक शिक्षा ही उज्जवल भविष्य की नींव मजबूत करती है।")
            ]
            for diff, text in sentences_hin:
                questions_to_seed.append(Question(
                    subject="literacy", competency="sentence_reading", difficulty=diff, grade_level=3,
                    text=f"Read this sentence aloud: [Hindi] {text}", correct_answer=text
                ))

            # Comprehension
            comp_eng = [
                (1, "Story: The cat has a red hat. Question: What color is the hat?", "red", ["red", "blue", "green"]),
                (2, "Story: Priya likes to paint. She painted a small house and a green tree. Question: What color is the tree?", "green", ["red", "green", "brown"]),
                (3, "Story: Rohan woke up early to pack his bag. Today was the school field trip to the science museum. He didn't want to be late. Question: Where was the school field trip going?", "science museum", ["science museum", "zoo", "park"]),
                (4, "Story: Honeybees live in large hives. The queen bee lays eggs, while worker bees collect nectar from flowers to make sweet honey. Question: Which bees collect nectar from flowers?", "worker bees", ["queen bee", "worker bees", "drones"]),
                (5, "Story: Seeds need soil, water, and sunlight to grow. The roots absorb nutrients from the soil, while leaves capture sunlight to generate energy through photosynthesis. Question: What process do leaves use to generate energy?", "photosynthesis", ["photosynthesis", "absorption", "germination"])
            ]
            for diff, text, ans, opts in comp_eng:
                questions_to_seed.append(Question(
                    subject="literacy", competency="comprehension", difficulty=diff, grade_level=3,
                    text=f"[English] {text}", correct_answer=ans, options=json.dumps(opts)
                ))
            comp_hin = [
                (1, "कहानी: चूहे के पास एक लाल टोपी है। प्रश्न: टोपी का रंग कैसा है?", "लाल", ["लाल", "पीला", "नीला"]),
                (2, "कहानी: प्रिया को चित्र बनाना पसंद है। उसने एक छोटा घर और एक हरा पेड़ बनाया। प्रश्न: पेड़ का रंग कैसा है?", "हरा", ["लाल", "हरा", "भूरा"]),
                (3, "कहानी: राहुल आज बहुत खुश था। आज उसकी पाठशाला का विज्ञान संग्रहालय का भ्रमण था। प्रश्न: राहुल की पाठशाला आज कहाँ जा रही थी?", "विज्ञान संग्रहालय", ["विज्ञान संग्रहालय", "चिड़ियाघर", "बगीचा"]),
                (4, "कहानी: मधुमक्खियाँ छत्ते में रहती हैं। रानी मक्खी अंडे देती है, जबकि कामगार मक्खियाँ शहद बनाने के लिए फूलों का रस इकट्ठा करती हैं। प्रश्न: फूलों का रस कौन सी मक्खियाँ लाती हैं?", "कामगार मक्खियाँ", ["रानी मक्खी", "कामगार मक्खियाँ", "नर मक्खी"]),
                (5, "कहानी: पौधों को बढ़ने के लिए मिट्टी, पानी और धूप की आवश्यकता होती है। पत्तियाँ प्रकाश संश्लेषण के माध्यम से ऊर्जा बनाती हैं। प्रश्न: पत्तियाँ ऊर्जा बनाने के लिए कौन सी प्रक्रिया अपनाती हैं?", "प्रकाश संश्लेषण", ["प्रकाश संश्लेषण", "अवशोषण", "अंकुरण"])
            ]
            for diff, text, ans, opts in comp_hin:
                questions_to_seed.append(Question(
                    subject="literacy", competency="comprehension", difficulty=diff, grade_level=3,
                    text=f"[Hindi] {text}", correct_answer=ans, options=json.dumps(opts)
                ))

            # --- NUMERACY ---
            # Number Recognition
            num_rec = [(1, "5"), (2, "18"), (3, "56"), (4, "307"), (5, "4082")]
            for diff, num in num_rec:
                questions_to_seed.append(Question(
                    subject="numeracy", competency="number_recognition", difficulty=diff, grade_level=1,
                    text=f"Read this number: {num}", correct_answer=num
                ))

            # Counting
            count_q = [
                (1, "Count dots: ●●●", "3", ["2", "3", "4"]),
                (2, "Count dots: ●●●●●●●", "7", ["5", "6", "7"]),
                (3, "Count fingers: 🖐️🖐️", "10", ["8", "10", "12"]),
                (4, "Count dots: 5 groups of 10", "50", ["40", "50", "60"]),
                (5, "Count items: 8 packs of 10 and 3 loose items", "83", ["73", "83", "93"])
            ]
            for diff, text, ans, opts in count_q:
                questions_to_seed.append(Question(
                    subject="numeracy", competency="counting", difficulty=diff, grade_level=1,
                    text=text, correct_answer=ans, options=json.dumps(opts)
                ))

            # Number Sense
            num_sense = [
                (1, "Which is bigger: 5 or 9?", "9", ["5", "9"]),
                (2, "What number comes next: 14, 15, _?", "16", ["13", "16", "17"]),
                (3, "Which number is smaller: 42 or 24?", "24", ["42", "24"]),
                (4, "Insert correct comparison symbol: 89 _ 98", "<", ["<", ">", "="]),
                (5, "What is the place value of 7 in 745?", "hundreds", ["ones", "tens", "hundreds"])
            ]
            for diff, text, ans, opts in num_sense:
                questions_to_seed.append(Question(
                    subject="numeracy", competency="number_sense", difficulty=diff, grade_level=2,
                    text=text, correct_answer=ans, options=json.dumps(opts)
                ))

            # Addition
            add_q = [
                (1, "2 + 3", "5", ["4", "5", "6"]),
                (2, "12 + 6", "18", ["17", "18", "19"]),
                (3, "35 + 24", "59", ["58", "59", "60"]),
                (4, "48 + 17", "65", ["55", "65", "75"]),
                (5, "135 + 248", "383", ["373", "383", "393"])
            ]
            for diff, text, ans, opts in add_q:
                questions_to_seed.append(Question(
                    subject="numeracy", competency="addition", difficulty=diff, grade_level=2,
                    text=text, correct_answer=ans, options=json.dumps(opts)
                ))

            # Subtraction
            sub_q = [
                (1, "5 - 2", "3", ["2", "3", "4"]),
                (2, "15 - 4", "11", ["10", "11", "12"]),
                (3, "48 - 25", "23", ["21", "23", "25"]),
                (4, "62 - 18", "44", ["44", "46", "54"]),
                (5, "305 - 147", "158", ["148", "158", "168"])
            ]
            for diff, text, ans, opts in sub_q:
                questions_to_seed.append(Question(
                    subject="numeracy", competency="subtraction", difficulty=diff, grade_level=3,
                    text=text, correct_answer=ans, options=json.dumps(opts)
                ))

            # Multiplication
            mult_q = [
                (1, "2 x 3", "6", ["5", "6", "8"]),
                (2, "5 x 4", "20", ["15", "20", "25"]),
                (3, "8 x 7", "56", ["54", "56", "64"]),
                (4, "15 x 6", "90", ["75", "90", "105"]),
                (5, "24 x 12", "288", ["240", "268", "288"])
            ]
            for diff, text, ans, opts in mult_q:
                questions_to_seed.append(Question(
                    subject="numeracy", competency="multiplication", difficulty=diff, grade_level=3,
                    text=text, correct_answer=ans, options=json.dumps(opts)
                ))

            db.bulk_save_objects(questions_to_seed)
            db.commit()

        # 2. Seed Mock Students and progress logs to draw charts instantly
        if db.query(Student).count() == 0:
            print("[Seeding] Seeding mock students...")
            students_list = [
                Student(name="Aman Sharma", age=8, grade=3, gender="Male", language="English", school="Government Primary School A"),
                Student(name="Riya Patel", age=7, grade=2, gender="Female", language="English", school="Government Primary School A"),
                Student(name="Rahul Naik", age=9, grade=3, gender="Male", language="English", school="Government Primary School A"),
                Student(name="Sneha Das", age=8, grade=3, gender="Female", language="English", school="Government Primary School A"),
                Student(name="Vikram Rathod", age=6, grade=1, gender="Male", language="English", school="Government Primary School A")
            ]
            db.bulk_save_objects(students_list)
            db.commit()

            # Add deep profile details for Aman (Grade 3 - struggling, High Risk)
            aman = db.query(Student).filter(Student.name == "Aman Sharma").first()
            if aman:
                # Add current low competency scores
                scores_aman = [
                    CompetencyScore(student_id=aman.id, competency="letter_recognition", score=80.0),
                    CompetencyScore(student_id=aman.id, competency="phonics", score=40.0),
                    CompetencyScore(student_id=aman.id, competency="word_reading", score=20.0),
                    CompetencyScore(student_id=aman.id, competency="sentence_reading", score=0.0),
                    CompetencyScore(student_id=aman.id, competency="comprehension", score=0.0),
                    CompetencyScore(student_id=aman.id, competency="reading_fluency", score=15.0),
                    CompetencyScore(student_id=aman.id, competency="number_recognition", score=80.0),
                    CompetencyScore(student_id=aman.id, competency="counting", score=60.0),
                    CompetencyScore(student_id=aman.id, competency="number_sense", score=20.0),
                    CompetencyScore(student_id=aman.id, competency="addition", score=20.0),
                    CompetencyScore(student_id=aman.id, competency="subtraction", score=0.0),
                    CompetencyScore(student_id=aman.id, competency="multiplication", score=0.0)
                ]
                db.bulk_save_objects(scores_aman)
                db.commit()

                # Learning gap: expected 3.0, actual: 1.1 years, gap: 1.9 years
                gap = LearningGap(student_id=aman.id, expected_grade=3.0, actual_level=1.1, gap_years=1.9)
                db.add(gap)
                
                # Risk level: MEDIUM
                risk = RiskLevel(student_id=aman.id, risk_level="MEDIUM")
                db.add(risk)

                # Progress history for line charts (Jan - May)
                history_aman = []
                base_time = datetime.utcnow() - timedelta(days=120) # 4 months ago
                for i, month_name in enumerate(["January", "February", "March", "April", "May"]):
                    time = base_time + timedelta(days=30 * i)
                    history_aman.append(ProgressHistory(student_id=aman.id, date=time, competency="phonics", score=20.0 + i * 5))
                    history_aman.append(ProgressHistory(student_id=aman.id, date=time, competency="counting", score=40.0 + i * 5))
                    history_aman.append(ProgressHistory(student_id=aman.id, date=time, competency="reading_fluency", score=5.0 + i * 2.5))
                db.bulk_save_objects(history_aman)

                # Seed recommendations
                rec = Recommendation(
                    student_id=aman.id,
                    competency="phonics",
                    risk_level="MEDIUM",
                    recommendation_text="1. Focus on CVC words blending using physical visual aids daily.\n2. Dedicate 10 minutes to phonics wheels mapping families like -at and -in.\n3. Pair with a reading buddy for collaborative sound reinforcement.",
                    parent_report="कृपया अमन के साथ घर पर रोज़ 10 मिनट शब्दों की ध्वनियों को जोड़कर पढ़ने का अभ्यास करें (जैसे: क+ल+म = कलम)।"
                )
                db.add(rec)
                db.commit()

            # Add deep profile details for Rahul (Grade 3 - severe gap, High Risk)
            rahul = db.query(Student).filter(Student.name == "Rahul Naik").first()
            if rahul:
                # Add low competency scores
                scores_rahul = [
                    CompetencyScore(student_id=rahul.id, competency="letter_recognition", score=40.0),
                    CompetencyScore(student_id=rahul.id, competency="phonics", score=20.0),
                    CompetencyScore(student_id=rahul.id, competency="word_reading", score=0.0),
                    CompetencyScore(student_id=rahul.id, competency="sentence_reading", score=0.0),
                    CompetencyScore(student_id=rahul.id, competency="comprehension", score=0.0),
                    CompetencyScore(student_id=rahul.id, competency="reading_fluency", score=0.0),
                    CompetencyScore(student_id=rahul.id, competency="number_recognition", score=40.0),
                    CompetencyScore(student_id=rahul.id, competency="counting", score=20.0),
                    CompetencyScore(student_id=rahul.id, competency="number_sense", score=0.0),
                    CompetencyScore(student_id=rahul.id, competency="addition", score=0.0),
                    CompetencyScore(student_id=rahul.id, competency="subtraction", score=0.0),
                    CompetencyScore(student_id=rahul.id, competency="multiplication", score=0.0)
                ]
                db.bulk_save_objects(scores_rahul)
                db.commit()

                # Learning gap: expected 3.0, actual: 0.5, gap: 2.5 years
                gap = LearningGap(student_id=rahul.id, expected_grade=3.0, actual_level=0.5, gap_years=2.5)
                db.add(gap)
                
                # Risk level: HIGH
                risk = RiskLevel(student_id=rahul.id, risk_level="HIGH")
                db.add(risk)

                # Progress history (Jan - May)
                history_rahul = []
                base_time = datetime.utcnow() - timedelta(days=120)
                for i, month_name in enumerate(["January", "February", "March", "April", "May"]):
                    time = base_time + timedelta(days=30 * i)
                    history_rahul.append(ProgressHistory(student_id=rahul.id, date=time, competency="letter_recognition", score=20.0 + i * 5))
                    history_rahul.append(ProgressHistory(student_id=rahul.id, date=time, competency="number_recognition", score=20.0 + i * 5))
                db.bulk_save_objects(history_rahul)

                # Seed recommendations
                rec = Recommendation(
                    student_id=rahul.id,
                    competency="letter_recognition",
                    risk_level="HIGH",
                    recommendation_text="1. Conduct tactile learning exercises with sand letters.\n2. Drill 1-on-1 visual flashcards for 5 minutes twice daily.\n3. Focus strictly on letters in Rahul's name first.",
                    parent_report="कृपया राहुल के साथ रेत या आटे पर उंगली चलाकर अक्षर लिखने का अभ्यास करें और रोज घर पर अक्षर ढूंढने का खेल खेलें।"
                )
                db.add(rec)
                db.commit()

            # Add deep profile details for Riya (Grade 2 - Low Risk)
            riya = db.query(Student).filter(Student.name == "Riya Patel").first()
            if riya:
                scores_riya = [
                    CompetencyScore(student_id=riya.id, competency="letter_recognition", score=100.0),
                    CompetencyScore(student_id=riya.id, competency="phonics", score=100.0),
                    CompetencyScore(student_id=riya.id, competency="word_reading", score=80.0),
                    CompetencyScore(student_id=riya.id, competency="sentence_reading", score=80.0),
                    CompetencyScore(student_id=riya.id, competency="comprehension", score=60.0),
                    CompetencyScore(student_id=riya.id, competency="reading_fluency", score=82.0),
                    CompetencyScore(student_id=riya.id, competency="number_recognition", score=100.0),
                    CompetencyScore(student_id=riya.id, competency="counting", score=100.0),
                    CompetencyScore(student_id=riya.id, competency="number_sense", score=80.0),
                    CompetencyScore(student_id=riya.id, competency="addition", score=80.0),
                    CompetencyScore(student_id=riya.id, competency="subtraction", score=60.0),
                    CompetencyScore(student_id=riya.id, competency="multiplication", score=40.0)
                ]
                db.bulk_save_objects(scores_riya)
                db.commit()

                # Learning gap: expected 2.0, actual: 1.8, gap: 0.2 years
                gap = LearningGap(student_id=riya.id, expected_grade=2.0, actual_level=1.8, gap_years=0.2)
                db.add(gap)
                
                # Risk level: LOW
                risk = RiskLevel(student_id=riya.id, risk_level="LOW")
                db.add(risk)

                # Progress history
                history_riya = []
                base_time = datetime.utcnow() - timedelta(days=120)
                for i, month_name in enumerate(["January", "February", "March", "April", "May"]):
                    time = base_time + timedelta(days=30 * i)
                    history_riya.append(ProgressHistory(student_id=riya.id, date=time, competency="sentence_reading", score=60.0 + i * 5))
                    history_riya.append(ProgressHistory(student_id=riya.id, date=time, competency="addition", score=60.0 + i * 5))
                db.bulk_save_objects(history_riya)
                db.commit()

            # Seed default scores and gap for Sneha (Grade 3) & Vikram (Grade 1)
            sneha = db.query(Student).filter(Student.name == "Sneha Das").first()
            if sneha:
                scores_sneha = [CompetencyScore(student_id=sneha.id, competency=c, score=40.0) for c in INITIAL_LITERACY_COMPETENCIES + INITIAL_NUMERACY_COMPETENCIES]
                db.bulk_save_objects(scores_sneha)
                gap = LearningGap(student_id=sneha.id, expected_grade=3.0, actual_level=2.0, gap_years=1.0)
                risk = RiskLevel(student_id=sneha.id, risk_level="MEDIUM")
                db.add(gap); db.add(risk)
                db.commit()
                
            vikram = db.query(Student).filter(Student.name == "Vikram Rathod").first()
            if vikram:
                scores_vikram = [CompetencyScore(student_id=vikram.id, competency=c, score=20.0) for c in INITIAL_LITERACY_COMPETENCIES + INITIAL_NUMERACY_COMPETENCIES]
                db.bulk_save_objects(scores_vikram)
                gap = LearningGap(student_id=vikram.id, expected_grade=1.0, actual_level=0.5, gap_years=0.5)
                risk = RiskLevel(student_id=vikram.id, risk_level="LOW")
                db.add(gap); db.add(risk)
                db.commit()
        else:
            # Force update all existing students to English for demonstration clarity
            db.query(Student).update({Student.language: "English"})
            db.commit()

            print("[Seeding] Seeding completed successfully!")
    except Exception as e:
        print(f"[Seeding Error] Seeding database failed: {e}")
    finally:
        db.close()

# Perform DB creation and seeding
Base.metadata.create_all(bind=engine)
seed_database()
