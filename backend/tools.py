"""
==============================================================================
AI Student Support Assistant - Agent Tools Module (tools.py)
==============================================================================
Role in Agentic Architecture:
Provides deterministic Python functions that the AI agent can intelligently invoke
to look up structured institutional facts, academic metrics, and verified procedures.
==============================================================================
"""

from typing import Dict, Any, List, Optional


# ==============================================================================
# TOOL 1: College FAQ Search Tool
# ==============================================================================
COLLEGE_FAQ_DATABASE = [
    {
        "id": "faq_lib_01",
        "category": "campus_facilities",
        "keywords": ["library", "hours", "borrow", "books", "fine", "checkout", "study room"],
        "question": "What are the Central Library hours and borrowing rules?",
        "answer": (
            "Apex Central Library is open Mon-Sat 8:00 AM - 11:00 PM, and Sun 10:00 AM - 6:00 PM. "
            "During finals week, reading rooms are open 24/7. "
            "Undergraduates can borrow up to 6 books for 14 days. Postgraduates can borrow 10 books for 28 days. "
            "Late return fine is $0.50 per book per day."
        ),
        "department": "University Library Services",
        "contact": "library-desk@apex.edu | Ext: 4010"
    },
    {
        "id": "faq_health_01",
        "category": "health_and_wellness",
        "keywords": ["health", "clinic", "doctor", "medical", "ambulance", "emergency", "sick", "counseling"],
        "question": "Where is the student health clinic and what services are free?",
        "answer": (
            "The Health Center is located next to Student Center Block A and operates 24/7 with on-duty physicians. "
            "Doctor consultations, vitals checkups, and basic first-aid medications are completely free for all active students. "
            "For medical emergencies or ambulance dispatch, call Ext 9110 or +1-800-APEX-MED. "
            "Confidential psychological counseling is available Mon-Fri 9:00 AM - 5:00 PM."
        ),
        "department": "Campus Health & Wellness Center",
        "contact": "health@apex.edu | Emergency: Ext 9110"
    },
    {
        "id": "faq_wifi_01",
        "category": "it_services",
        "keywords": ["wifi", "internet", "network", "connect", "portal", "password", "login"],
        "question": "How do I connect to campus Wi-Fi and reset my portal login?",
        "answer": (
            "Connect to network SSID 'Apex-Student-Secure' using WPA2/WPA3 Enterprise. "
            "Enter your Student Roll Number (e.g., APX2024CS042) as the username, and your student portal password. "
            "Up to 3 personal devices can be registered per student. "
            "To reset credentials, visit the IT Helpdesk in Technology Tower Ground Floor or use the portal self-service link."
        ),
        "department": "Information Technology Services",
        "contact": "it-helpdesk@apex.edu | Ext: 2020"
    },
    {
        "id": "faq_id_01",
        "category": "administrative_services",
        "keywords": ["id card", "smart card", "lost card", "replace id", "rfid", "badge"],
        "question": "What is the procedure for a lost student ID card?",
        "answer": (
            "1. Instantly deactivate the lost card via the Student ERP Portal to protect RFID building access and meal credits. "
            "2. Fill out the Lost Card Replacement Form at Student Affairs Center (SAC) Counter 3. "
            "3. Pay the $20 replacement fee online or at the bursar. "
            "4. A new smart ID card is issued within 2 business days; an interim paper pass is provided immediately."
        ),
        "department": "Student Affairs Center (SAC)",
        "contact": "sac-desk@apex.edu | Counter 3"
    },
    {
        "id": "faq_bursar_01",
        "category": "administrative_services",
        "keywords": ["fees", "tuition", "payment", "installment", "late fee", "bursar", "scholarship"],
        "question": "When are semester tuition fees due and can I pay in installments?",
        "answer": (
            "Tuition and residence fees must be settled prior to course registration for each term. "
            "Students facing genuine hardship may apply for a 2-part split installment plan through the Bursar Office "
            "at least two weeks before term start. A $5/day fee is assessed for delayed payments beyond the due date."
        ),
        "department": "Office of the Bursar & Financial Aid",
        "contact": "bursar@apex.edu | Admin Block Room 102"
    },
    {
        "id": "faq_hostel_01",
        "category": "campus_facilities",
        "keywords": ["hostel", "dorm", "room", "curfew", "housing", "warden", "check-in"],
        "question": "What are hostel curfew hours and room change regulations?",
        "answer": (
            "Campus residence halls enforce a 10:00 PM curfew on Sunday-Thursday and 11:00 PM on Friday-Saturday. "
            "Late arrivals require prior approval from the Residential Warden. "
            "Room change requests open during the 3rd week of each term via the Hostel Management Portal."
        ),
        "department": "Residential Life & Housing",
        "contact": "housing@apex.edu | Warden Office Ext: 5050"
    }
]


def college_faq_search(query: str, category: str = "all") -> Dict[str, Any]:
    """
    Search the college's verified frequently asked questions (FAQ) knowledge base.
    
    Args:
        query: The topic or keywords to search for (e.g. 'library hours', 'lost ID', 'wifi setup').
        category: Optional filter ('campus_facilities', 'health_and_wellness', 'it_services', 'administrative_services', 'all').

    Returns:
        Structured result dictionary containing matched FAQ entries, matched score, and verified department contacts.
    """
    q_tokens = set(query.lower().replace("?", "").replace(",", "").split())
    scored_results = []

    for item in COLLEGE_FAQ_DATABASE:
        if category != "all" and item["category"] != category:
            continue

        match_score = 0
        # Keyword intersection
        for kw in item["keywords"]:
            if kw in query.lower():
                match_score += 3
            for token in q_tokens:
                if token in kw:
                    match_score += 1

        # Question text match
        for token in q_tokens:
            if token in item["question"].lower():
                match_score += 2

        if match_score > 0:
            scored_results.append((match_score, item))

    # Sort descending by score
    scored_results.sort(key=lambda x: x[0], reverse=True)
    top_matches = [item for score, item in scored_results[:2]]

    if top_matches:
        return {
            "status": "success",
            "tool_name": "college_faq_search",
            "matches_found": len(top_matches),
            "results": top_matches
        }
    else:
        return {
            "status": "not_found",
            "tool_name": "college_faq_search",
            "message": f"No direct FAQ entry found matching query '{query}' in category '{category}'."
        }


# ==============================================================================
# TOOL 2: Academic Information Lookup Tool
# ==============================================================================
ACADEMIC_DATA = {
    "grading_scale": {
        "title": "10-Point University Grading Framework",
        "grades": [
            {"letter": "O", "description": "Outstanding", "points": 10, "marks_range": "90 - 100%"},
            {"letter": "A+", "description": "Excellent", "points": 9, "marks_range": "80 - 89%"},
            {"letter": "A", "description": "Very Good", "points": 8, "marks_range": "70 - 79%"},
            {"letter": "B+", "description": "Good", "points": 7, "marks_range": "60 - 69%"},
            {"letter": "B", "description": "Above Average", "points": 6, "marks_range": "55 - 59%"},
            {"letter": "C", "description": "Average", "points": 5, "marks_range": "50 - 54%"},
            {"letter": "P", "description": "Pass", "points": 4, "marks_range": "40 - 49%"},
            {"letter": "F", "description": "Fail", "points": 0, "marks_range": "< 40%"},
            {"letter": "FA", "description": "Failed due to Attendance (<65%)", "points": 0, "marks_range": "N/A"}
        ],
        "passing_threshold": "Minimum 40% in Final Exam and minimum 50% aggregate score overall."
    },
    "gpa_calculation": {
        "title": "SGPA and CGPA Calculation Formulas",
        "sgpa_formula": "SGPA = Σ (Course Credits × Grade Points Earned) / Total Semester Credits Registered",
        "cgpa_formula": "CGPA = Σ (Total Credits × Grade Points Earned across all terms) / Total Cumulative Credits Registered",
        "example": "A 4-credit course with Grade 'A' (8 pts) contributes 4 * 8 = 32 quality points."
    },
    "deans_list": {
        "title": "Dean's Honors List Eligibility Criteria",
        "minimum_sgpa": 9.20,
        "credit_condition": "Must be enrolled in standard full-time credit load (minimum 18 credits).",
        "conduct_condition": "Zero active disciplinary citations and zero course backlogs/re-sits.",
        "recognition": "Dean's Honor Scroll and permanent notation on the official academic transcript."
    },
    "academic_probation": {
        "title": "Academic Probation Regulations",
        "threshold": "Cumulative GPA (CGPA) below 5.00 at the close of any academic year.",
        "restrictions": "Registration capped at 16 maximum credits for subsequent term; mandatory bi-weekly academic tutoring.",
        "dismissal_rule": "Failure to elevate CGPA to at least 5.0 within two consecutive probation semesters leads to academic separation."
    },
    "course_prerequisites": {
        "title": "Core Computer Science Course Prerequisites",
        "courses": [
            {"code": "CS100", "title": "Intro to Programming", "prereq": "None"},
            {"code": "CS101", "title": "Data Structures & Algorithms", "prereq": "CS100 (Pass grade)"},
            {"code": "CS201", "title": "Design & Analysis of Algorithms", "prereq": "CS101"},
            {"code": "CS205", "title": "Operating Systems", "prereq": "CS101"},
            {"code": "CS302", "title": "Database Management Systems", "prereq": "CS101"},
            {"code": "CS410", "title": "Artificial Intelligence & Agents", "prereq": "CS201 and CS302"}
        ]
    },
    "graduation_credits": {
        "title": "Undergraduate B.Tech Degree Credit Requirements",
        "total_required": 160,
        "distribution": {
            "Basic Sciences & Math": 24,
            "Engineering Foundations": 18,
            "Professional Major Core": 54,
            "Professional Electives": 24,
            "Open Electives & Humanities": 16,
            "Senior Capstone Design Project": 24
        }
    }
}


def academic_info_lookup(topic: str, detail_type: str = "general") -> Dict[str, Any]:
    """
    Look up verified academic regulations, grading scales, GPA formulas, prerequisites, or Dean's list criteria.

    Args:
        topic: The academic topic ('grading_scale', 'gpa_calculation', 'deans_list', 'academic_probation', 'course_prerequisites', 'graduation_credits').
        detail_type: Specific detail focus or 'general'.

    Returns:
        Structured official academic information dictionary.
    """
    clean_topic = topic.lower().strip().replace(" ", "_").replace("-", "_")

    # Fuzzy matching for user/agent inputs
    matched_key = None
    if any(k in clean_topic for k in ["grade", "grading", "scale", "letter", "marks", "fail"]):
        matched_key = "grading_scale"
    elif any(k in clean_topic for k in ["gpa", "sgpa", "cgpa", "formula", "calculate"]):
        matched_key = "gpa_calculation"
    elif any(k in clean_topic for k in ["dean", "honor", "list", "merit"]):
        matched_key = "deans_list"
    elif any(k in clean_topic for k in ["probation", "warning", "dismissal", "low_gpa"]):
        matched_key = "academic_probation"
    elif any(k in clean_topic for k in ["prereq", "prerequisite", "cs101", "cs201", "eligibility"]):
        matched_key = "course_prerequisites"
    elif any(k in clean_topic for k in ["credit", "graduation", "total_credit", "degree"]):
        matched_key = "graduation_credits"
    elif clean_topic in ACADEMIC_DATA:
        matched_key = clean_topic

    if matched_key and matched_key in ACADEMIC_DATA:
        return {
            "status": "success",
            "tool_name": "academic_info_lookup",
            "topic": matched_key,
            "data": ACADEMIC_DATA[matched_key]
        }
    else:
        return {
            "status": "not_found",
            "tool_name": "academic_info_lookup",
            "available_topics": list(ACADEMIC_DATA.keys()),
            "message": f"Topic '{topic}' not found. Supported topics: {list(ACADEMIC_DATA.keys())}"
        }


# ==============================================================================
# TOOL REGISTRY & DISPATCHER
# ==============================================================================
AVAILABLE_TOOLS = {
    "college_faq_search": {
        "function": college_faq_search,
        "description": "Searches the official college FAQ database for facility hours (library, gym), health center clinics, wifi configuration, ID card issuance, fee deadlines, and hostel rules.",
        "parameters": {
            "query": "string (keywords or student question)",
            "category": "string (optional: 'campus_facilities', 'health_and_wellness', 'it_services', 'administrative_services', 'all')"
        }
    },
    "academic_info_lookup": {
        "function": academic_info_lookup,
        "description": "Looks up definitive academic regulations: 10-point grading scales, SGPA/CGPA formulas, Dean's List requirements, academic probation rules, graduation credit requirements, and course prerequisites.",
        "parameters": {
            "topic": "string ('grading_scale', 'gpa_calculation', 'deans_list', 'academic_probation', 'course_prerequisites', 'graduation_credits')",
            "detail_type": "string (optional: 'general')"
        }
    }
}


def execute_tool(tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a tool by name with arguments and handles any runtime errors gracefully.
    """
    if tool_name not in AVAILABLE_TOOLS:
        return {
            "status": "error",
            "message": f"Tool '{tool_name}' is not registered. Available tools: {list(AVAILABLE_TOOLS.keys())}"
        }

    func = AVAILABLE_TOOLS[tool_name]["function"]
    try:
        result = func(**arguments)
        return result
    except Exception as e:
        return {
            "status": "error",
            "tool_name": tool_name,
            "message": f"Error executing {tool_name}: {str(e)}"
        }
