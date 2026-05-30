import requests
import json
from typing import Dict, Any, Optional, List

LM_STUDIO_URL = "http://localhost:1234/v1/chat/completions"

# ==========================================
# Deterministic Fallback Recommendation templates
# ==========================================
FALLBACK_RECOMMENDATIONS = {
    "literacy": {
        "letter_recognition": {
            "HIGH": {
                "teacher": "1. Daily 1-on-1 visual tracking using sand letters and letter flashcards.\n2. Limit sessions to 5 minutes, 3 times a day.\n3. Focus on letters in the child's own name first.\n4. Use physical tactile shapes (dough, clay) to mold letter outlines.",
                "parent": "कृप्या बच्चे को रोज 10 मिनट अपने आस-पास की वस्तुओं में अक्षर ढूंढने को कहें। जैसे बर्तनों, विज्ञापनों या पुस्तकों में अक्षरों को दिखाना।"
            },
            "MEDIUM": {
                "teacher": "1. Peer pairing: Pair the student with a peer who knows letters well.\n2. Play 'Letter Bingo' in small groups of 4-5 students.\n3. Integrate tracing worksheets in daily work.",
                "parent": "बच्चे के साथ रेत या आटे पर उंगली से अक्षर लिखने का खेल खेलें और उन्हें पहचानने को कहें।"
            },
            "LOW": {
                "teacher": "1. Reinforce letter writing and sound matching.\n2. Have the student lead small letter-drill activities in the classroom.",
                "parent": "बच्चे को घर में उपलब्ध अखबार या कहानियों की किताबों में से परिचित अक्षरों को पहचानने और गोला लगाने को कहें।"
            }
        },
        "phonics": {
            "HIGH": {
                "teacher": "1. Individualized attention on single-letter sound mappings (e.g. 'c' says /k/).\n2. Use visual sound charts and hand gestures representing sound paths.\n3. Read short CVC (Consonant-Vowel-Consonant) words aloud to the student, highlighting middle sounds.",
                "parent": "बच्चे के साथ छोटे शब्दों की आवाज़ों को तोड़कर बोलने का खेल खेलें (जैसे: क-ल-म = कलम)।"
            },
            "MEDIUM": {
                "teacher": "1. Run structured phonics blending exercises in small groups.\n2. Practice sound substitution games (e.g., change /c/ in 'cat' to /b/ to make 'bat').\n3. Use word family wheels (e.g., -at, -an, -in families).",
                "parent": "बच्चे को हर रोज़ छोटे-छोटे 3-अक्षरों वाले शब्दों की ध्वनियों को जोड़कर पढ़ने का अभ्यास कराएं।"
            },
            "LOW": {
                "teacher": "1. Practice spelling regular words and recognizing digraphs (sh, ch, th).\n2. Read aloud decodable books in class.",
                "parent": "बच्चे को नए शब्दों की पहली और आखिरी ध्वनि पहचानने के लिए प्रोत्साहित करें।"
            }
        },
        "word_reading": {
            "HIGH": {
                "teacher": "1. Target high-frequency sight words (the, of, is) using flashcards with pictures.\n2. Use the 'Look, Say, Cover, Write, Check' methodology.\n3. Avoid complex paragraph reading; focus entirely on single words.",
                "parent": "घर में रोज दिखने वाली चीजों पर नाम की पर्चियां (लेबल) लगाएं, जैसे: 'घड़ा', 'दरवाजा', 'किताब'।"
            },
            "MEDIUM": {
                "teacher": "1. Use word walls and sorting activities (nouns, verbs, or by word lengths).\n2. Conduct 'I Spy' word games in reading corners.\n3. Encourage blending of 2-syllable words.",
                "parent": "बच्चे को कहानियों की किताबों में से साधारण शब्दों को पढ़ने और उनके चित्र बनाने को कहें।"
            },
            "LOW": {
                "teacher": "1. Introduce prefix and suffix patterns.\n2. Read short, simple sentences containing studied vocabulary.",
                "parent": "बच्चे को कहानियों से नए और कठिन शब्दों को खोजने और उनके अर्थ समझने में मदद करें।"
            }
        },
        "sentence_reading": {
            "HIGH": {
                "teacher": "1. Guide the student to read structured 3-word sentences ('She can run').\n2. Use pointing strategies (pointing under each word with a finger or stick).\n3. Avoid compound sentences.",
                "parent": "बच्चे के साथ मिलकर बहुत छोटी कहानियां पढ़ें, जहां आप एक वाक्य पढ़ें और बच्चा दूसरा वाक्य दोहराए।"
            },
            "MEDIUM": {
                "teacher": "1. Practice punctuation recognition (pausing at full stops and question marks).\n2. Scaffold reading using sentence strip puzzles (cut sentences into words and reassemble).\n3. Daily shared reading circles.",
                "parent": "बच्चे को घर में छोटी-छोटी पर्चियों पर लिखे काम या संदेश पढ़ने को दें।"
            },
            "LOW": {
                "teacher": "1. Build reading confidence by reading paragraph-length stories.\n2. Work on expressions and character voices.",
                "parent": "बच्चे से उसकी पसंद की कोई कहानी पढ़वाएं और उसका अर्थ अपनी भाषा में समझाने को कहें।"
            }
        },
        "comprehension": {
            "HIGH": {
                "teacher": "1. Ask literal, immediate questions during read-alouds ('Who was in the tree?').\n2. Use picture cards to sequence story events (beginning, middle, end).\n3. Use physical acting to model story verbs.",
                "parent": "कहानी सुनाने के बाद बच्चे से बहुत सरल सवाल पूछें, जैसे: 'कहानी में भालू ने क्या खाया?'"
            },
            "MEDIUM": {
                "teacher": "1. Encourage prediction queries ('What do you think will happen next?').\n2. Teach basic concept maps mapping characters, settings, and conflicts.\n3. Re-read stories to ensure memory retention.",
                "parent": "बच्चे से कहानी के अंत को बदलने को कहें, जैसे: 'अगर खरगोश नहीं सोता, तो कहानी में क्या होता?'"
            },
            "LOW": {
                "teacher": "1. Move towards analytical questions ('Why did the character make that decision?').\n2. Have the student write short summaries in their own words.",
                "parent": "बच्चे से पूछें कि उसे कहानी का कौन सा पात्र सबसे अच्छा लगा और क्यों।"
            }
        }
    },
    "numeracy": {
        "number_recognition": {
            "HIGH": {
                "teacher": "1. Tactile number formation (sandpaper numbers, tracing in flour).\n2. Limit numbers to 1-5, then 1-10.\n3. Match numbers to concrete physical objects (e.g. card showing '3' next to 3 stones).",
                "parent": "बच्चे को घर में वस्तुओं को गिनकर उनके अंकों को लिखवाने का अभ्यास कराएं (जैसे: 4 चम्मच)।"
            },
            "MEDIUM": {
                "teacher": "1. Introduce number lines up to 20.\n2. Play 'Number Hide and Seek' in the classroom.\n3. Fill in missing number worksheets (e.g., 5, _, 7, 8).",
                "parent": "बच्चे को घर के दरवाजों के नंबर, कैलेंडर की तारीखें या नोटों पर लिखे नंबरों को पहचानने को कहें।"
            },
            "LOW": {
                "teacher": "1. Work on multi-digit numbers (100+).\n2. Explain place values (tens and ones) using base-ten blocks.",
                "parent": "बच्चे को बड़े नोटों और मूल्य पर्चियों (प्राइस टैग) पर लिखे अंकों को पढ़ने में मदद करें।"
            }
        },
        "counting": {
            "HIGH": {
                "teacher": "1. Visual and physical counting drills using beads, marbles, or sticks.\n2. Focus on one-to-one correspondence (touching each item while counting).\n3. Count together loudly in rhythmic steps.",
                "parent": "बच्चे को रसोई में प्याज, आलू या कटोरियों को जोर-जोर से गिनने को कहें।"
            },
            "MEDIUM": {
                "teacher": "1. Group counting: Count items by tens or fives.\n2. Practice backward counting from 10 to 1.\n3. Hopscotch counting games in the schoolyard.",
                "parent": "सीढ़ियां चढ़ते समय बच्चे से सीढ़ियों को 2-2 या 5-5 के अंतराल में गिनने का अभ्यास कराएं।"
            },
            "LOW": {
                "teacher": "1. Introduce skip counting (2s, 5s, 10s) up to 100.\n2. Solve simple word puzzles relating to order.",
                "parent": "बच्चे को सिक्कों के माध्यम से 10-10 की ढेरी बनाकर गिनना सिखाएं।"
            }
        },
        "number_sense": {
            "HIGH": {
                "teacher": "1. Work on 'more vs less' using piles of bricks or buttons.\n2. Subitizing practice: Flash patterns of dots (like dice) and ask how many without counting.\n3. Focus on small numbers first (1 to 5).",
                "parent": "दो कटोरियों में अलग-अलग मात्रा में दाल या चावल रखें और पूछें कि किसमें 'कम' और किसमें 'अधिक' है।"
            },
            "MEDIUM": {
                "teacher": "1. Compare numbers using symbols (>, <, =).\n2. Locate relative positions of numbers on physical number lines.\n3. Group numbers into odd and even categories.",
                "parent": "बच्चे को दो अलग-अलग वस्तुओं के पैकेट की कीमतों की तुलना करने को कहें (कौन सा महंगा है)।"
            },
            "LOW": {
                "teacher": "1. Introduce base-ten models and place-value charts for 3-digit numbers.\n2. Work on estimation games.",
                "parent": "बच्चे के साथ अनुमान लगाने के खेल खेलें: 'इस डिब्बे में कितनी टॉफियां हो सकती हैं?'"
            }
        },
        "addition": {
            "HIGH": {
                "teacher": "1. Concrete addition only: Combine physical piles of counters.\n2. Count on fingers starting from the first number.\n3. Sum numbers up to 5.",
                "parent": "पेंसिल या चम्मचों के दो छोटे समूहों को एक साथ मिलाकर कुल संख्या गिनने को कहें (जैसे: 2 चम्मच + 3 चम्मच)।"
            },
            "MEDIUM": {
                "teacher": "1. Pictorial addition: Draw lines or dots to represent and solve sums.\n2. Focus on single digit equations (e.g. 5 + 3 = 8).\n3. Relate addition to word stories ('Raj has 4 apples, gets 2 more').",
                "parent": "दुकान से सामान लाते समय छोटे रुपयों को जोड़ने का खेल खेलें (जैसे: 5 रुपये की चॉकलेट + 2 रुपये की टॉफी)।"
            },
            "LOW": {
                "teacher": "1. Carry-over addition with 2-digit numbers.\n2. Add multiples of 10 mentally (e.g., 30 + 40).",
                "parent": "बच्चे से कहें कि वह घर के खर्चों की छोटी पर्चियों के जोड़ की जांच करे।"
            }
        },
        "subtraction": {
            "HIGH": {
                "teacher": "1. Take-away concrete modeling: Start with 5 items, remove 2, count remainder.\n2. Cross-out drawings: Draw objects, cross out subtracted quantity, count left.",
                "parent": "प्लेट में 5 बिस्कुट रखें, बच्चे से 2 खाने को कहें, फिर गिनें कि कितने बचे हैं।"
            },
            "MEDIUM": {
                "teacher": "1. Simple vertical subtraction without borrowing.\n2. Backwards counting on number lines to subtract.\n3. Solve basic subtraction word scenarios.",
                "parent": "खेल-खेल में सवाल पूछें: 'हमारे पास 8 केले थे, 3 खराब हो गए, अब कितने ताजे केले बचे?'"
            },
            "LOW": {
                "teacher": "1. Subtraction involving borrowing (regrouping).\n2. Verify addition problems using subtraction.",
                "parent": "बच्चे को खरीददारी के बाद दुकानदार से मिलने वाले बचे पैसे (चेंज) को गिनने का काम सौंपें।"
            }
        },
        "multiplication": {
            "HIGH": {
                "teacher": "1. Model multiplication as repeated addition (e.g. 2 + 2 + 2 = 3 times 2).\n2. Create physical arrays using grid paper or blocks (2 rows of 3 blocks).",
                "parent": "बच्चे को 2-2 बिस्कुट के 3 जोड़े बनाने को कहें, फिर समझाएं कि यह 3 गुणा 2 बराबर 6 है।"
            },
            "MEDIUM": {
                "teacher": "1. Memorize simple skip tables (2, 5, 10).\n2. Represent multiplication with visual grid patterns.\n3. Basic single-digit facts.",
                "parent": "बच्चे के साथ खेल-खेल में पहाड़ों (tables) को लयबद्ध तरीके से दोहराएं।"
            },
            "LOW": {
                "teacher": "1. Solve double-digit by single-digit products (e.g. 12 x 3).\n2. Solve multi-step word scenarios involving multiplication.",
                "parent": "बच्चे को घर में कुल अंडों या डिब्बों की संख्या पंक्तियों (rows) के माध्यम से गुणा करके निकालने को कहें।"
            }
        }
    }
}

def clean_competency_key(competency: str) -> str:
    """Helper to convert database names to dict lookup keys."""
    # e.g., "Number Recognition" -> "number_recognition"
    return competency.lower().replace(" ", "_")

def get_recommendation_from_api(system_prompt: str, user_prompt: str) -> Optional[str]:
    """Tries to connect to LM Studio to get a response."""
    payload = {
        "model": "gemma-3-4b",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 500
    }
    
    try:
        response = requests.post(
            LM_STUDIO_URL, 
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=3.5 # Fast timeout to fall back immediately if server is down
        )
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
    except Exception as e:
        # Ignore errors and fall back gracefully
        print(f"[AI Recommender] LM Studio connection failed: {e}. Falling back to rule-based templates.")
    return None

def generate_teacher_recommendation(student_name: str, subject: str, competency: str, risk_level: str, grade: int) -> Dict[str, str]:
    """
    Generates actionable classroom intervention recommendations.
    Checks LM Studio first, and falls back to static templates.
    """
    comp_key = clean_competency_key(competency)
    subj_key = subject.lower()
    risk_upper = risk_level.upper()

    # System instruction
    system_prompt = (
        "You are an expert educational counselor and Foundational Literacy & Numeracy (FLN) coach. "
        "Your task is to provide clear, actionable, bulleted classroom recommendations for a teacher "
        "helping a student struggling with a specific competency."
    )
    
    user_prompt = (
        f"Generate classroom intervention recommendations for student '{student_name}'.\n"
        f"Subject: {subject}\n"
        f"Weak Competency: {competency}\n"
        f"Risk Level: {risk_level}\n"
        f"Grade: {grade}\n"
        "Provide exactly 3-4 highly practical, specific instructions that the teacher can do during class time. "
        "Do not include introductory or closing chit-chat."
    )

    # 1. Try to get recommendation from LM Studio
    gpt_response = get_recommendation_from_api(system_prompt, user_prompt)
    if gpt_response:
        # Also try parent report from API
        parent_prompt = (
            f"Generate a parent report in simple Hindi (using Devanagari script) for '{student_name}' who is "
            f"in Grade {grade} and is struggling with '{competency}' (Risk: {risk_level}).\n"
            "Tell the parent 2 simple things they can do at home. Keep it polite, encouraging, and short (max 3 sentences). "
            "Write ONLY the Hindi text, no English introductions."
        )
        parent_response = get_recommendation_from_api(system_prompt, parent_prompt)
        return {
            "teacher": gpt_response,
            "parent": parent_response or "बच्चे को घर में प्रतिदिन कुछ समय पढ़ने या गिनने के सरल अभ्यास कराएं।",
            "mode": "LM Studio (Gemma 3 4B)"
        }

    # 2. Fall back to rules-based dictionary
    teacher_text = "1. Allocate 10 minutes of daily guided study focusing on fundamental concepts.\n2. Utilize concrete visual models (pictures, physical objects).\n3. Pair with a supportive classroom buddy."
    parent_text = "कृपया बच्चे के साथ घर पर रोज़ 10 मिनट पढ़ाई का अभ्यास करें और उनकी प्रगति को प्रोत्साहित करें।"

    try:
        if subj_key in FALLBACK_RECOMMENDATIONS and comp_key in FALLBACK_RECOMMENDATIONS[subj_key]:
            templates = FALLBACK_RECOMMENDATIONS[subj_key][comp_key]
            # Match risk level
            matched_risk = "MEDIUM"
            if risk_upper in templates:
                matched_risk = risk_upper
                
            teacher_text = templates[matched_risk]["teacher"]
            parent_text = templates[matched_risk]["parent"]
    except Exception as e:
        print(f"[AI Recommender] Error parsing fallback dict: {e}")

    return {
        "teacher": teacher_text,
        "parent": parent_text,
        "mode": "Offline (Local Fallback)"
    }

def generate_class_summary_ai(grade: int, stats: Dict[str, Any]) -> str:
    """Generates an overall pedagogical summary of the class using LM Studio or fallback."""
    system_prompt = (
        "You are an FLN Program Coordinator. Summarize class metrics and suggest a group-level remedial focus."
    )
    user_prompt = (
        f"Provide a brief summary for a Grade {grade} class with these metrics:\n"
        f"- Total Students: {stats.get('total_students', 0)}\n"
        f"- High Risk Students: {stats.get('high_risk_count', 0)}\n"
        f"- Average Learning Gap: {stats.get('avg_learning_gap', 0.0):.1f} years\n"
        f"- Bottom 3 Weak Competencies: {', '.join(stats.get('weak_competencies', []))}\n"
        "Provide exactly 2 paragraphs: Paragraph 1 summarizing the gap situation, and Paragraph 2 detailing group-level remedial strategies. Keep it professional."
    )
    
    gpt_response = get_recommendation_from_api(system_prompt, user_prompt)
    if gpt_response:
        return gpt_response
        
    # Fallback
    weaks = stats.get('weak_competencies', ["Phonics", "Addition"])
    fallback_summary = (
        f"Class Grade {grade} shows a critical learning gap pattern. Out of {stats.get('total_students', 0)} students, "
        f"{stats.get('high_risk_count', 0)} are flagged in the High Risk category, with an average academic gap of "
        f"{stats.get('avg_learning_gap', 0.0):.1f} grade levels. The primary problem focus centers on: {', '.join(weaks)}. "
        "Many students are missing early building blocks, which is blocking their ability to absorb current grade curriculum.\n\n"
        "Action Plan: We recommend initiating a 30-day class-wide remedial cycle. Divide the classroom into three multi-level groups "
        "during math and language sessions. Dedicate 20 minutes daily to peer-led games targeting visual mapping and phonetic blending. "
        "Track weekly attendance and re-assess high-risk students in 4 weeks."
    )
    return fallback_summary


# ==========================================
# AI Question Generator Logic
# ==========================================

def generate_question_ai(subject: str, competency: str, difficulty: int, grade_level: int, language: str) -> Dict[str, Any]:
    """
    Generates a realistic, educational FLN question matching criteria using Gemma 3 4B (LM Studio).
    Falls back to a structured rule-based generator if LM Studio is offline.
    """
    system_prompt = (
        "You are an expert Foundational Literacy & Numeracy (FLN) question developer. "
        "Your task is to generate a single, highly educational and age-appropriate question.\n"
        "Respond ONLY with a valid JSON object matching this exact schema:\n"
        "{\n"
        "  \"text\": \"Question text or story passage to show. Avoid tongue twisters.\",\n"
        "  \"options\": [\"Option 1\", \"Option 2\", \"Option 3\"], // Exactly 3 options as a list of strings, or null/empty list if it is a reading/short answer question\n"
        "  \"correct_answer\": \"The exact correct answer value matching the options or expected text\"\n"
        "}\n"
        "Return ONLY the JSON text. Do not include markdown wraps or explanations."
    )
    
    user_prompt = (
        f"Generate a single question for:\n"
        f"Subject: {subject}\n"
        f"Competency: {competency}\n"
        f"Difficulty Level: {difficulty} (scale 1 to 5)\n"
        f"Grade Level: {grade_level}\n"
        f"Language: {language}\n"
        "Make sure it is simple, educational, and clear."
    )

    gpt_response = get_recommendation_from_api(system_prompt, user_prompt)
    if gpt_response:
        try:
            clean_json = gpt_response.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_json)
            if "text" in parsed and "correct_answer" in parsed:
                # Ensure options format is correct
                options_val = None
                if parsed.get("options"):
                    options_val = json.dumps(parsed["options"])
                
                return {
                    "text": parsed["text"],
                    "options": options_val,
                    "correct_answer": parsed["correct_answer"],
                    "subject": subject,
                    "competency": competency,
                    "difficulty": difficulty,
                    "grade_level": grade_level,
                    "language": language,
                    "question_type": "MCQ" if options_val else "Dictation" if competency == "dictation" else "Reading" if subject == "literacy" else "Numeracy"
                }
        except Exception as e:
            print(f"[AI Question Gen] Failed to parse Gemma response: {e}. Using fallback.")

    # Fallback offline generator
    return generate_question_fallback(subject, competency, difficulty, grade_level, language)


def generate_question_fallback(subject: str, competency: str, difficulty: int, grade_level: int, language: str) -> Dict[str, Any]:
    """Generates a structured, age-appropriate fallback question offline."""
    # Literacy Fallbacks
    if subject.lower() == "literacy":
        if competency == "dictation":
            words = {
                "English": ["cat", "apple", "garden", "mountain", "celebration"],
                "Hindi": ["कल", "कमल", "सूरज", "दरवाजा", "विद्यालय"],
                "Marathi": ["घर", "झाड", "शाळा", "दरवाजा", "पुस्तकालय"],
                "Gujarati": ["ઘર", "ઝાડ", "શાળા", "દરવાજો", "પુસ્તકાલય"],
                "Bengali": ["ঘর", "আম", "বই", "বিদ্যালয়", "লাইব্রেরি"],
                "Tamil": ["பல்", "மரம்", "பள்ளி", "ஆசிரியர்", "புத்தகம்"],
                "Telugu": ["కల", "బడి", "పువ్వు", "ఉపాధ్యాయుడు", "పుస్తకం"]
            }
            lang_pool = words.get(language, words["English"])
            word = lang_pool[min(difficulty - 1, len(lang_pool) - 1)]
            
            text = "Listen and type the word you hear: [Dictation]"
            if language == "Hindi":
                text = "सुनें और जो शब्द आप सुन रहे हैं उसे टाइप करें: [Dictation]"
            elif language == "Marathi":
                text = "ऐका आणि तुम्ही ऐकत असलेला शब्द टाईप करा: [Dictation]"
            elif language == "Gujarati":
                text = "સાંભળો અને જે શબ્દ તમે સાંભળો છો તે લખો: [Dictation]"
            elif language == "Bengali":
                text = "শুনুন এবং যে শব্দটি আপনি শুনছেন তা টাইপ করুন: [Dictation]"
            elif language == "Tamil":
                text = "கேட்டு, நீங்கள் கேட்கும் வார்த்தையைத் தட்டச்சு செய்யவும்: [Dictation]"
            elif language == "Telugu":
                text = "విని, మీరు వినే పదాన్ని టైప్ చేయండి: [Dictation]"
                
            return {
                "text": text,
                "options": None,
                "correct_answer": word,
                "subject": "literacy",
                "competency": competency,
                "difficulty": difficulty,
                "grade_level": grade_level,
                "language": language,
                "question_type": "Dictation"
            }
            
        elif competency == "sentence_reading":
            sentences = {
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
                ]
            }
            lang_pool = sentences.get(language, sentences["English"])
            sentence = lang_pool[min(difficulty - 1, len(lang_pool) - 1)]
            
            prompt = f"Read this sentence aloud: {sentence}" if language == "English" else f"इस वाक्य को ज़ोर से पढ़ें: {sentence}"
            return {
                "text": prompt,
                "options": None,
                "correct_answer": sentence,
                "subject": "literacy",
                "competency": competency,
                "difficulty": difficulty,
                "grade_level": grade_level,
                "language": language,
                "question_type": "Reading"
            }
            
        else: # comprehension
            if language == "English":
                return {
                    "text": "Story: Priya has a little white dog named Spot. Spot likes to run in the park. Question: What is the dog's name?",
                    "options": json.dumps(["Spot", "Priya", "White"]),
                    "correct_answer": "Spot",
                    "subject": "literacy",
                    "competency": competency,
                    "difficulty": difficulty,
                    "grade_level": grade_level,
                    "language": language,
                    "question_type": "MCQ"
                }
            else:
                return {
                    "text": "कहानी: राहुल के पास एक सफ़ेद कुत्ता है जिसका नाम टॉमी है। टॉमी को पार्क में दौड़ना पसंद है। प्रश्न: कुत्ते का नाम क्या है?",
                    "options": json.dumps(["टॉमी", "राहुल", "सफ़ेद"]),
                    "correct_answer": "टॉमी",
                    "subject": "literacy",
                    "competency": competency,
                    "difficulty": difficulty,
                    "grade_level": grade_level,
                    "language": language,
                    "question_type": "MCQ"
                }

    # Numeracy Fallbacks
    else:
        if competency == "number_recognition":
            nums = ["8", "18", "73", "409", "5162"]
            num = nums[min(difficulty - 1, len(nums) - 1)]
            return {
                "text": f"Read the number: {num}",
                "options": None,
                "correct_answer": num,
                "subject": "numeracy",
                "competency": competency,
                "difficulty": difficulty,
                "grade_level": grade_level,
                "language": language,
                "question_type": "Numeracy"
            }
        elif competency == "counting":
            dots = "●" * (difficulty * 2)
            ans = str(difficulty * 2)
            opts = [str(difficulty * 2 - 1), ans, str(difficulty * 2 + 1)]
            return {
                "text": f"Count the dots: {dots}",
                "options": json.dumps(opts),
                "correct_answer": ans,
                "subject": "numeracy",
                "competency": competency,
                "difficulty": difficulty,
                "grade_level": grade_level,
                "language": language,
                "question_type": "MCQ"
            }
        elif competency == "number_sense":
            ans = str(difficulty * 10)
            opts = [str(difficulty * 10 - 5), ans, str(difficulty * 10 + 5)]
            return {
                "text": f"What number comes next: {difficulty*10 - 2}, {difficulty*10 - 1}, _ ?",
                "options": json.dumps(opts),
                "correct_answer": ans,
                "subject": "numeracy",
                "competency": competency,
                "difficulty": difficulty,
                "grade_level": grade_level,
                "language": language,
                "question_type": "MCQ"
            }
        elif competency == "addition":
            n1 = difficulty * 3
            n2 = difficulty * 2
            ans = str(n1 + n2)
            opts = [str(n1 + n2 - 1), ans, str(n1 + n2 + 1)]
            return {
                "text": f"Solve: {n1} + {n2} = ?",
                "options": json.dumps(opts),
                "correct_answer": ans,
                "subject": "numeracy",
                "competency": competency,
                "difficulty": difficulty,
                "grade_level": grade_level,
                "language": language,
                "question_type": "MCQ"
            }
        elif competency == "subtraction":
            n1 = difficulty * 5
            n2 = difficulty * 2
            ans = str(n1 - n2)
            opts = [str(n1 - n2 - 1), ans, str(n1 - n2 + 1)]
            return {
                "text": f"Solve: {n1} - {n2} = ?",
                "options": json.dumps(opts),
                "correct_answer": ans,
                "subject": "numeracy",
                "competency": competency,
                "difficulty": difficulty,
                "grade_level": grade_level,
                "language": language,
                "question_type": "MCQ"
            }
        else: # multiplication
            n1 = difficulty + 1
            n2 = difficulty
            ans = str(n1 * n2)
            opts = [str(n1 * n2 - n2), ans, str(n1 * n2 + n2)]
            return {
                "text": f"Solve: {n1} x {n2} = ?",
                "options": json.dumps(opts),
                "correct_answer": ans,
                "subject": "numeracy",
                "competency": competency,
                "difficulty": difficulty,
                "grade_level": grade_level,
                "language": language,
                "question_type": "MCQ"
            }
