import os
import json
from datetime import datetime, timedelta
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database import Base, engine, SessionLocal
from backend.models.schemas import (
    Student, Question, CompetencyScore, LearningGap, RiskLevel, 
    ProgressHistory, Recommendation, Assessment, School, Teacher
)
from backend.routes import students, questions, assessments, dashboard, ai

app = FastAPI(
    title="FLN Compass API",
    description="Offline-First Foundational Literacy & Numeracy Diagnostic Intelligence System Backend",
    version="1.1.0"
)

# CORS configurations for React/Vite development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# Mount Static Files for local audio recordings playback
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
static_dir = os.path.join(BACKEND_DIR, "static")
audio_dir = os.path.join(static_dir, "audio")
os.makedirs(audio_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "FLN Compass",
        "database": "SQLite (Offline)",
        "ai_engine": "LM Studio (Gemma 3 4B Compatible)",
        "audio_dir": audio_dir
    }


# ==========================================
# Database Seeding on Startup
# ==========================================

INITIAL_LITERACY_COMPETENCIES = ["dictation", "sentence_reading", "comprehension"]
INITIAL_NUMERACY_COMPETENCIES = ["number_recognition", "counting", "number_sense", "addition", "subtraction", "multiplication"]

def seed_database():
    db = SessionLocal()
    try:
        # Force refresh all tables for a clean, reproducible schema reset
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("[Seeding] Database tables recreated successfully.")
        
        # 1. Seed Schools
        schools = [
            School(name="Government Primary School, Block A", location="New Delhi"),
            School(name="Dr. Ambedkar Public School", location="Mumbai"),
            School(name="Vidya Mandir FLN Academy", location="Pune")
        ]
        db.bulk_save_objects(schools)
        db.commit()
        
        # 2. Seed Teachers
        teachers = [
            Teacher(name="Sunita Sharma", email="sunita@fln.gov.in", school_id=1),
            Teacher(name="Ramesh Patel", email="ramesh@fln.gov.in", school_id=2),
            Teacher(name="Anjali Das", email="anjali@fln.gov.in", school_id=3)
        ]
        db.bulk_save_objects(teachers)
        db.commit()
        
        # 3. Seed Questions
        questions_to_seed = []
        languages = ["English", "Hindi", "Marathi", "Gujarati", "Bengali", "Tamil", "Telugu"]
        
        # Dictation words by language and difficulty (Grade 1 to 3 ranges)
        dictation_by_lang = {
            "English": {
                1: ["cat", "sun", "dog", "pen", "box"],
                2: ["apple", "book", "door", "milk", "hand"],
                3: ["garden", "school", "window", "pencil", "flower"],
                4: ["mountain", "beautiful", "rainbow", "village", "brother"],
                5: ["celebration", "education", "intelligence", "government", "understanding"]
            },
            "Hindi": {
                1: ["कल", "घर", "जल", "फल", "नल"],
                2: ["कमल", "अमन", "सड़क", "बटन", "नमक"],
                3: ["सूरज", "किताब", "गमला", "लड़का", "चम्मच"],
                4: ["दरवाजा", "पाठशाला", "खिड़की", "बगीचा", "नारियल"],
                5: ["विद्यालय", "प्रधानाचार्य", "पुस्तकालय", "शुभकामना", "अनुशासन"]
            },
            "Marathi": {
                1: ["घर", "कप", "नळ", "जग", "वर"],
                2: ["झाड", "फूल", "पान", "हात", "पाय"],
                3: ["शाळा", "बहीण", "भाऊ", "ससा", "चिमणी"],
                4: ["दरवाजा", "खिडकी", "शिक्षक", "मित्र", "नदी"],
                5: ["पुस्तकालय", "विद्यार्थी", "प्राथमिक", "सुट्टी", "अभ्यास"]
            },
            "Gujarati": {
                1: ["ઘર", "કપ", "નળ", "જગ", "વન"],
                2: ["ઝાડ", "ફૂલ", "પાન", "હાથ", "પગ"],
                3: ["શાળા", "બહેન", "ભાઈ", "સસલું", "ચકલી"],
                4: ["દરવાજો", "બારી", "શિક્ષક", "મિત્ર", "નદી"],
                5: ["પુસ્તકાલય", "વિદ્યાર્થી", "પ્રાથમિક", "રજાઓ", "અભ્યાસ"]
            },
            "Bengali": {
                1: ["ঘর", "কল", "ফল", "জল", "নল"],
                2: ["আম", "জাম", "হাত", "পা", "মাথা"],
                3: ["বই", "কলম", "পাতা", "পাখি", "ছেলে"],
                4: ["বিদ্যালয়", "শিক্ষক", "বোন", "ভাই", "নদী"],
                5: ["লাইব্রেরি", "ছাত্র", "প্রাথমিক", "ছুটি", "পড়াশোনা"]
            },
            "Tamil": {
                1: ["பல்", "கல்", "கை", "பூ", "வா"],
                2: ["மரம்", "படம்", "கண்", "காது", "தலை"],
                3: ["பள்ளி", "அன்பு", "அம்மா", "அப்பா", "தம்பி"],
                4: ["ஆசிரியர்", "மாணவன்", "நண்பன்", "வீடு", "நாடு"],
                5: ["புத்தகம்", "கல்வி", "முயற்சி", "வெற்றி", "ஆரோக்கியம்"]
            },
            "Telugu": {
                1: ["కల", "వల", "ఆట", "పాట", "ఆవు"],
                2: ["బడి", "ఇల్లు", "అమ్మ", "అయ్య", "తమ్ముడు"],
                3: ["పువ్వు", "చేట్టు", "ఆకు", "కన్ను", "చేయి"],
                4: ["ఉపాధ్యాయుడు", "విద్యార్థి", "స్నేహితుడు", "నది", "సముద్రం"],
                5: ["పుస్తకం", "చదువు", "విజయం", "ఆరోగ్యం", "పరిశ్రమ"]
            }
        }
        
        # Grade 2 Simple Sentences
        sentences_by_lang = {
            "English": [
                "The cat sat.",
                "The boy is playing.",
                "We go to school every morning.",
                "Rainy days are perfect for reading stories.",
                "Foundational learning builds the pathway to success."
            ],
            "Hindi": [
                "घर चल।",
                "राम फल खा।",
                "हम रोज पाठशाला जाते हैं।",
                "बरसात के मौसम में मोर नाचता है।",
                "प्राथमिक शिक्षा ही उज्जवल भविष्य की नींव मजबूत करती है।"
            ],
            "Marathi": [
                "घरी चल.",
                "राम आंबा खा.",
                "आम्ही रोज शाळेत जातो.",
                "पावसाळ्यात मोर नाचतो.",
                "प्राथमिक शिक्षण ही उज्ज्वल भविष्याची पायाभरणी आहे."
            ],
            "Gujarati": [
                "ઘરે ચાલ.",
                "રામ કેરી ખા.",
                "અમે રોજ શાળાએ જઈએ છીએ.",
                "ચોમાસામાં મોર નાચે છે.",
                "પ્રાથમિક શિક્ષણ ઉજ્જવળ ભવિષ્યનો પાયો છે."
            ],
            "Bengali": [
                "বাড়ি চলো।",
                "রাম আম খাও।",
                "আমরা রোজ বিদ্যালয়ে যাই।",
                "বর্ষাকালে ময়ূর নাচে।",
                "প্রাথমিক শিক্ষাই উজ্জ্বল ভবিষ্যতের ভিত্তি মজবুত করে।"
            ],
            "Tamil": [
                "வீட்டிற்கு செல்.",
                "ராம் பழம் சாப்பிடு.",
                "நாங்கள் தினமும் பள்ளிக்குச் செல்கிறோம்.",
                "மழைக்காலத்தில் மயில் நடனமாடுகிறது.",
                "தொடக்கக் கல்வி பிரகாசமான எதிர்காலத்திற்கு அடித்தளமாகும்."
            ],
            "Telugu": [
                "ఇంటికి వెళ్ళు.",
                "రాముడు పండు తిన్నాడు.",
                "మేము రోజు బడికి వెళ్తాము.",
                "వర్షాకాలంలో నెమలి నాట్యం చేస్తుంది.",
                "ప్రాథమిక విద్యే ఉజ్వల భవిష్యత్తుకు పునాది."
            ]
        }
        
        # Grade 3 Short Paragraphs
        paragraphs_by_lang = {
            "English": [
                "Priya has a little white dog named Spot. Spot loves to run in the green park. Every afternoon, Priya throws a red ball, and Spot fetches it quickly.",
                "Rohan woke up early to pack his bag. Today was the school field trip to the science museum. He did not want to be late for the school bus.",
                "Honeybees live in large hives. The queen bee lays eggs, while worker bees collect sweet nectar from colorful flowers to make tasty honey.",
                "Seeds need soil, water, and sunlight to grow. The roots absorb nutrients from the soil, while leaves capture sunlight to generate energy.",
                "The library is a quiet place full of books. Students visit to read stories, research science topics, or borrow novels to read at home."
            ],
            "Hindi": [
                "प्रिया के पास एक छोटा सफेद कुत्ता है जिसका नाम स्पॉट है। स्पॉट को हरे पार्क में दौड़ना बहुत पसंद है। वह बहुत तेज़ भागता है।",
                "रोहन आज सुबह बहुत जल्दी उठ गया। आज उसकी पाठशाला का विज्ञान संग्रहालय का भ्रमण था। वह बस के लिए लेट नहीं होना चाहता था।",
                "मधुमक्खियाँ बड़े छत्तों में रहती हैं। रानी मक्खी अंडे देती है, जबकि कामगार मक्खियाँ मीठा शहद बनाने के लिए फूलों का रस लाती हैं।",
                "पौधों को बढ़ने के लिए मिट्टी, पानी और धूप की आवश्यकता होती है। जड़ें मिट्टी से पोषक तत्व सोखती हैं और पत्तियाँ ऊर्जा बनाती हैं।",
                "पुस्तकालय किताबों से भरा एक शांत स्थान है। छात्र वहाँ कहानियाँ पढ़ने, विज्ञान पर शोध करने या किताबें घर ले जाने आते हैं।"
            ]
        }
        
        # Comprehension Passages for Grade 4 & 5
        comp_by_lang = {
            "English": [
                # Grade 4 passages
                {"story": "Story: The sun was setting when Ravi found a locked wooden box in the garden. Inside, there was a small golden key and an old map pointing to the big oak tree. Question: Where was the box found?", "correct": "garden", "options": ["garden", "house", "oak tree"], "grade": 4},
                {"story": "Story: Ants work together to gather food during the summer. They store seeds and leaves deep inside their underground nest so they have enough food to survive the cold winter. Question: When do ants gather food?", "correct": "summer", "options": ["winter", "summer", "spring"], "grade": 4},
                # Grade 5 passages
                {"story": "Story: Rainwater harvesting is the simple process of collecting and storing rainwater for future use. It helps recharge groundwater levels, prevents water scarcity in summers, and reduces soil erosion. Question: What is a benefit of harvesting rainwater?", "correct": "prevents water scarcity", "options": ["increases soil erosion", "prevents water scarcity", "pollutes groundwater"], "grade": 5}
            ],
            "Hindi": [
                # Grade 4 passages
                {"story": "कहानी: शाम हो रही थी जब रवि को बगीचे में एक बंद लकड़ी का डिब्बा मिला। उसके अंदर एक छोटी सुनहरी चाबी और एक पुराना नक्शा था जो बड़े बरगद के पेड़ की ओर इशारा कर रहा था। प्रश्न: डिब्बा कहाँ मिला था?", "correct": "बगीचे में", "options": ["बगीचे में", "घर में", "पेड़ के नीचे"], "grade": 4},
                {"story": "कहानी: चींटियाँ गर्मियों में एक साथ मिलकर भोजन इकट्ठा करती हैं। वे अपने भूमिगत घोंसले में बीज और पत्तियां जमा करती हैं ताकि ठंड में जीवित रह सकें। प्रश्न: चींटियाँ भोजन कब इकट्ठा करती हैं?", "correct": "गर्मियों में", "options": ["सर्दियों में", "गर्मियों में", "वसंत में"], "grade": 4},
                # Grade 5 passages
                {"story": "कहानी: वर्षा जल संचयन भविष्य के उपयोग के लिए बारिश के पानी को इकट्ठा करने की प्रक्रिया है। यह भूजल स्तर को बढ़ाता है, गर्मियों में पानी की कमी को रोकता है और मिट्टी के कटाव को कम करता है। प्रश्न: वर्षा जल संचयन का क्या लाभ है?", "correct": "गर्मियों में पानी की कमी को रोकता है", "options": ["मिट्टी का कटाव बढ़ाता है", "गर्मियों में पानी की कमी को रोकता है", "भूजल को प्रदूषित करता है"], "grade": 5}
            ]
        }
        
        # Seed Literacy Questions dynamically
        for lang in languages:
            # A. Dictation (Grade 1 to 3 ranges, replacing Letter, Phonics, Word reading)
            lang_dictation = dictation_by_lang.get(lang, dictation_by_lang["English"])
            for diff in range(1, 6):
                words_list = lang_dictation.get(diff, lang_dictation[1])
                for word in words_list:
                    text = "Listen and type the word you hear: [Dictation]"
                    if lang == "Hindi":
                        text = "सुनें और जो शब्द आप सुन रहे हैं उसे टाइप करें: [Dictation]"
                    elif lang == "Marathi":
                        text = "ऐका आणि तुम्ही ऐकत असलेला शब्द टाईप करा: [Dictation]"
                    elif lang == "Gujarati":
                        text = "સાંભળો અને જે શબ્દ તમે સાંભળો છો તે લખો: [Dictation]"
                    elif lang == "Bengali":
                        text = "শুনুন এবং যে শব্দটি আপনি শুনছেন তা টাইপ করুন: [Dictation]"
                    elif lang == "Tamil":
                        text = "கேட்டு, நீங்கள் கேட்கும் வார்த்தையைத் தட்டச்சு செய்யவும்: [Dictation]"
                    elif lang == "Telugu":
                        text = "విని, మీరు వినే పదాన్ని టైప్ చేయండి: [Dictation]"
                        
                    questions_to_seed.append(Question(
                        subject="literacy", competency="dictation", difficulty=diff, grade_level=min(3, diff),
                        text=text, correct_answer=word, options=None, language=lang, question_type="Dictation"
                    ))
                
            # D. Sentence Reading (Grade 2 - simple sentences)
            lang_sents = sentences_by_lang.get(lang, sentences_by_lang["English"])
            for diff in range(1, 6):
                sent = lang_sents[(diff - 1) % len(lang_sents)]
                text = f"Read this sentence aloud: {sent}" if lang == "English" else f"इस वाक्य को ज़ोर से पढ़ें: {sent}"
                questions_to_seed.append(Question(
                    subject="literacy", competency="sentence_reading", difficulty=diff, grade_level=2,
                    text=text, correct_answer=sent, options=None, language=lang, question_type="Reading"
                ))

            # E. Sentence Reading - Short Paragraphs (Grade 3 - paragraphs)
            lang_paras = paragraphs_by_lang.get(lang, paragraphs_by_lang["English"])
            for diff in range(1, 6):
                para = lang_paras[(diff - 1) % len(lang_paras)]
                text = f"Read this short paragraph aloud: {para}" if lang == "English" else f"इस लघु अनुच्छेद को ज़ोर से पढ़ें: {para}"
                questions_to_seed.append(Question(
                    subject="literacy", competency="sentence_reading", difficulty=diff, grade_level=3,
                    text=text, correct_answer=para, options=None, language=lang, question_type="Reading"
                ))
                
            # F. Comprehension & Passages (Grade 4 & 5)
            lang_comps = comp_by_lang.get(lang, comp_by_lang["English"])
            for diff in range(1, 6):
                grade = 4 if diff <= 3 else 5
                comp_data = lang_comps[(diff - 1) % len(lang_comps)]
                questions_to_seed.append(Question(
                    subject="literacy", competency="comprehension", difficulty=diff, grade_level=grade,
                    text=comp_data["story"], correct_answer=comp_data["correct"], 
                    options=json.dumps(comp_data["options"]), language=lang, question_type="MCQ"
                ))

        # Seed Numeracy Questions for all 7 languages
        numeracy_trans = {
            "English": {"num": "Read the number: {}", "count": "Count the dots: {}", "solve": "Solve: {}", "opt": "Which number is bigger: {} or {}?", "opt_ans": "{}"},
            "Hindi": {"num": "संख्या पढ़ें: {}", "count": "बिंदुओं को गिनें: {}", "solve": "हल करें: {}", "opt": "कौन सी संख्या बड़ी है: {} या {}?", "opt_ans": "{}"},
            "Marathi": {"num": "संख्या वाचा: {}", "count": "ठिपके मोजा: {}", "solve": "सोडवा: {}", "opt": "कोणती संख्या मोठी आहे: {} की {}?", "opt_ans": "{}"},
            "Gujarati": {"num": "સંખ્યા વાંચો: {}", "count": "ટપકાં ગણો: {}", "solve": "ઉકેલો: {}", "opt": "કઈ સંખ્યા મોટી છે: {} કે {}?", "opt_ans": "{}"},
            "Bengali": {"num": "সংখ্যাটি পড়ুন: {}", "count": "বিন্দুগুলি গণনা করুন: {}", "solve": "সমাধান করুন: {}", "opt": "কোন সংখ্যাটি বড়: {} নাকি {}?", "opt_ans": "{}"},
            "Tamil": {"num": "எண்ணைப் படிக்கவும்: {}", "count": "புள்ளிகளை எண்ணுங்கள்: {}", "solve": "தீர்க்கவும்: {}", "opt": "எந்த எண் பெரியது: {} அல்லது {}?", "opt_ans": "{}"},
            "Telugu": {"num": "సంఖ్యను చదవండి: {}", "count": "చుక్కలను లెక్కించండి: {}", "solve": "పరిష్కరించండి: {}", "opt": "ఏ సంఖ్య పెద్దది: {} లేదా {}?", "opt_ans": "{}"}
        }

        for lang in languages:
            trans = numeracy_trans.get(lang, numeracy_trans["English"])
            
            # 1. Number Recognition
            nums = ["5", "18", "56", "307", "4082"]
            for diff in range(1, 6):
                val = nums[diff - 1]
                questions_to_seed.append(Question(
                    subject="numeracy", competency="number_recognition", difficulty=diff, grade_level=1,
                    text=trans["num"].format(val), correct_answer=val, options=None, language=lang, question_type="Numeracy"
                ))

            # 2. Counting
            count_vals = [(1, 3), (2, 7), (3, 10), (4, 50), (5, 83)]
            for diff, val in count_vals:
                dots = "●" * min(val, 10) if val <= 10 else f"{val // 10} groups of 10"
                opts = [str(val - 2), str(val), str(val + 2)]
                questions_to_seed.append(Question(
                    subject="numeracy", competency="counting", difficulty=diff, grade_level=1,
                    text=trans["count"].format(dots), correct_answer=str(val), options=json.dumps(opts), language=lang, question_type="MCQ"
                ))

            # 3. Number Sense
            num_sense_vals = [
                (1, "5", "9", "9"),
                (2, "14, 15, _", "16", "16"),
                (3, "42", "24", "42"),
                (4, "89 _ 98 (use < or >)", "<", "<"),
                (5, "Place value of 7 in 745", "hundreds", "hundreds")
            ]
            for diff, q_text, ans, orig in num_sense_vals:
                opts = ["<", ">", "="] if "_" in q_text else [ans, "other", "none"]
                text = trans["solve"].format(q_text) if "_" in q_text or "value" in q_text else trans["opt"].format(q_text, ans)
                questions_to_seed.append(Question(
                    subject="numeracy", competency="number_sense", difficulty=diff, grade_level=2,
                    text=text, correct_answer=ans, options=json.dumps(opts) if opts else None, language=lang, question_type="MCQ"
                ))

            # 4. Addition
            adds = [(1, "2 + 3", "5"), (2, "12 + 6", "18"), (3, "35 + 24", "59"), (4, "48 + 17", "65"), (5, "135 + 248", "383")]
            for diff, eq, ans in adds:
                opts = [str(int(ans) - 2), ans, str(int(ans) + 2)]
                questions_to_seed.append(Question(
                    subject="numeracy", competency="addition", difficulty=diff, grade_level=2,
                    text=trans["solve"].format(eq), correct_answer=ans, options=json.dumps(opts), language=lang, question_type="MCQ"
                ))

            # 5. Subtraction
            subs = [(1, "5 - 2", "3"), (2, "15 - 4", "11"), (3, "48 - 25", "23"), (4, "62 - 18", "44"), (5, "305 - 147", "158")]
            for diff, eq, ans in subs:
                opts = [str(int(ans) - 3), ans, str(int(ans) + 3)]
                questions_to_seed.append(Question(
                    subject="numeracy", competency="subtraction", difficulty=diff, grade_level=3,
                    text=trans["solve"].format(eq), correct_answer=ans, options=json.dumps(opts), language=lang, question_type="MCQ"
                ))

            # 6. Multiplication
            mults = [(1, "2 x 3", "6"), (2, "5 x 4", "20"), (3, "8 x 7", "56"), (4, "15 x 6", "90"), (5, "24 x 12", "288")]
            for diff, eq, ans in mults:
                opts = [str(int(ans) - 10), ans, str(int(ans) + 10)]
                questions_to_seed.append(Question(
                    subject="numeracy", competency="multiplication", difficulty=diff, grade_level=3,
                    text=trans["solve"].format(eq), correct_answer=ans, options=json.dumps(opts), language=lang, question_type="MCQ"
                ))

        db.bulk_save_objects(questions_to_seed)
        db.commit()
        print(f"[Seeding] Seeding question bank completed: {len(questions_to_seed)} questions added.")

        # 4. Seed Mock Students
        students_list = [
            Student(name="Aman Sharma", age=8, grade=3, gender="Male", language="English", school="Government Primary School, Block A", school_id=1, teacher_id=1),
            Student(name="Riya Patel", age=7, grade=2, gender="Female", language="English", school="Government Primary School, Block A", school_id=1, teacher_id=1),
            Student(name="Rahul Naik", age=9, grade=3, gender="Male", language="English", school="Dr. Ambedkar Public School", school_id=2, teacher_id=2),
            Student(name="Sneha Das", age=8, grade=3, gender="Female", language="English", school="Vidya Mandir FLN Academy", school_id=3, teacher_id=3),
            Student(name="Vikram Rathod", age=6, grade=1, gender="Male", language="English", school="Government Primary School, Block A", school_id=1, teacher_id=1)
        ]
        db.bulk_save_objects(students_list)
        db.commit()

        # Update deep baseline scores for mock students so dashboards display charts instantly
        aman = db.query(Student).filter(Student.name == "Aman Sharma").first()
        if aman:
            scores_aman = [
                CompetencyScore(student_id=aman.id, competency="dictation", score=60.0),
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
            gap = LearningGap(student_id=aman.id, expected_grade=3.0, actual_level=1.1, gap_years=1.9)
            risk = RiskLevel(student_id=aman.id, risk_level="MEDIUM")
            db.add(gap); db.add(risk)

            # Progress logs
            history_aman = []
            base_time = datetime.utcnow() - timedelta(days=120)
            for i, month_name in enumerate(["January", "February", "March", "April", "May"]):
                time = base_time + timedelta(days=30 * i)
                history_aman.append(ProgressHistory(student_id=aman.id, date=time, competency="dictation", score=20.0 + i * 5))
                history_aman.append(ProgressHistory(student_id=aman.id, date=time, competency="counting", score=40.0 + i * 5))
                history_aman.append(ProgressHistory(student_id=aman.id, date=time, competency="reading_fluency", score=5.0 + i * 2.5))
            db.bulk_save_objects(history_aman)

            rec = Recommendation(
                student_id=aman.id, competency="dictation", risk_level="MEDIUM",
                recommendation_text="1. Focus on hearing word spelling and typing it on device daily.\n2. Dedicate 10 minutes to listening dictation games.",
                parent_report="कृपया अमन के साथ घर पर रोज़ 10 मिनट शब्दों को सुनकर लिखने का अभ्यास करें।"
            )
            db.add(rec)
            db.commit()

        rahul = db.query(Student).filter(Student.name == "Rahul Naik").first()
        if rahul:
            scores_rahul = [
                CompetencyScore(student_id=rahul.id, competency="dictation", score=30.0),
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
            gap = LearningGap(student_id=rahul.id, expected_grade=3.0, actual_level=0.5, gap_years=2.5)
            risk = RiskLevel(student_id=rahul.id, risk_level="HIGH")
            db.add(gap); db.add(risk)

            history_rahul = []
            base_time = datetime.utcnow() - timedelta(days=120)
            for i in range(5):
                time = base_time + timedelta(days=30 * i)
                history_rahul.append(ProgressHistory(student_id=rahul.id, date=time, competency="dictation", score=20.0 + i * 5))
                history_rahul.append(ProgressHistory(student_id=rahul.id, date=time, competency="number_recognition", score=20.0 + i * 5))
            db.bulk_save_objects(history_rahul)

            rec = Recommendation(
                student_id=rahul.id, competency="dictation", risk_level="HIGH",
                recommendation_text="1. Run auditory letter recognition and simple word mapping exercises.\n2. Focus on auditory blending.",
                parent_report="कृपया राहुल के साथ अक्षरों की आवाज़ सुनकर शब्द लिखने का अभ्यास करें।"
            )
            db.add(rec)
            db.commit()

        riya = db.query(Student).filter(Student.name == "Riya Patel").first()
        if riya:
            scores_riya = [
                CompetencyScore(student_id=riya.id, competency="dictation", score=90.0),
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
            gap = LearningGap(student_id=riya.id, expected_grade=2.0, actual_level=1.8, gap_years=0.2)
            risk = RiskLevel(student_id=riya.id, risk_level="LOW")
            db.add(gap); db.add(risk)

            history_riya = []
            base_time = datetime.utcnow() - timedelta(days=120)
            for i in range(5):
                time = base_time + timedelta(days=30 * i)
                history_riya.append(ProgressHistory(student_id=riya.id, date=time, competency="sentence_reading", score=60.0 + i * 5))
                history_riya.append(ProgressHistory(student_id=riya.id, date=time, competency="addition", score=60.0 + i * 5))
            db.bulk_save_objects(history_riya)
            db.commit()

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

        print("[Seeding] Complete database seeding finished successfully!")
    except Exception as e:
        print(f"[Seeding Error] Seeding database failed: {e}")
    finally:
        db.close()

# Perform DB creation and seeding
Base.metadata.create_all(bind=engine)
seed_database()
