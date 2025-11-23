# 🎓 TrustFolio

**Student Achievement Portfolio with LinkedTrust Backend Integration**

TrustFolio is a modern web application that allows students to create and manage verifiable claims about their achievements, skills, and projects. Fully integrated with the LinkedTrust backend for persistent, verifiable credentials.

![TrustFolio](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-93.6%25-blue?style=flat&logo=typescript)
![Status](https://img.shields.io/badge/Status-Active-green)
![Backend](https://img.shields.io/badge/Backend-Integrated-brightgreen)

## ✨ Features

- 🔐 **User Authentication** - Sign up and login with LinkedTrust backend
- 📝 **Create Achievements** - Log projects, skills, and certifications
- 🤖 **AI Descriptions** - Generate achievement descriptions with AI
- ⭐ **Star Ratings** - Rate your proficiency level (1-5 stars)
- 🏆 **Portfolio View** - Beautiful card-based display of all achievements
- ☁️ **Cloud Storage** - Claims stored on LinkedTrust network
- 🔗 **Fully Integrated** - Real-time sync with LinkedTrust backend
- 🎨 **Modern UI** - Responsive design with Tailwind CSS

## 🚀 Tech Stack

- **Framework:** Next.js 16.0 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Backend:** LinkedTrust API (dev.linkedtrust.us)
- **Storage:** LocalStorage (fallback) + LinkedTrust Backend (primary)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/artworxai/trustfolio.git
cd trustfolio
```

2. Install dependencies
```bash
npm install
```

3. Create `.env.local` file
```bash
NEXT_PUBLIC_API_BASE_URL=https://dev.linkedtrust.us
```

4. Run development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

1. **Sign Up / Login**
   - Create account or login on home page
   - Credentials stored securely with LinkedTrust backend

2. **Create an Achievement**
   - Click "+ Add Achievement" 
   - Select category (Project, Skill, or Certification)
   - Enter keywords and optionally generate AI description
   - Rate your proficiency (1-5 stars)
   - Set the date
   - Claims save to LinkedTrust backend automatically

3. **View Portfolio**
   - Portfolio displays all claims from backend
   - Real-time sync with LinkedTrust network
   - Each card shows: category, description, rating, and dates

## 🔌 API Integration

TrustFolio is **fully integrated** with the LinkedTrust backend API.

### API Documentation
- **Dev Environment:** https://dev.linkedtrust.us/api/docs/
- **Production:** https://live.linkedtrust.us/api/docs/
- **API Base URL:** https://dev.linkedtrust.us

### Authentication
- Uses Bearer token authentication
- Endpoints: 
  - Sign up: `POST /auth/signup`
  - Login: `POST /auth/login`

### Claims Endpoints
- **Create claim:** `POST /api/claims`
- **Query by issuer:** `GET /api/claim?issuer_id={issuer_uri}`

### Key Integration Details

**Issuer ID Format:**
```
http://trustclaims.whatscookin.us/user/{userId}
```

**Subject Format:**
```
http://trustclaims.whatscookin.us/user/{userId}
```

**Required Fields:**
- `subject` - User URI (not email for privacy)
- `claim` - Claim type (e.g., "HAS_SKILL", "COMPLETED_PROJECT")
- `statement` - Achievement description
- `howKnown` - Must be "FIRST_HAND" (all caps)
- `effectiveDate` - ISO date string

For full API documentation, visit: https://dev.linkedtrust.us/api/docs/

## 🏗️ Architecture
```
trustfolio/
├── app/
│   ├── page.tsx              # Home/Landing page
│   ├── login/
│   │   └── page.tsx          # Login page
│   ├── register/
│   │   └── page.tsx          # Registration page
│   ├── create/
│   │   └── page.tsx          # Create achievement form
│   └── portfolio/
│       └── page.tsx          # Portfolio display
├── lib/
│   ├── auth-context.tsx      # Authentication context & state
│   └── linkedclaims.ts       # Claims management & API client
└── components/               # Future reusable components
```

## 🔮 Future Enhancements

- [ ] Share portfolio via unique URL
- [ ] Export to PDF
- [ ] Endorsements from others
- [ ] GitHub integration for automatic project claims
- [ ] LinkedIn export
- [ ] Vercel deployment
- [ ] Claim editing and deletion

## 🐛 Known Issues

- React "unique key" warning in console (non-blocking, fixed in code)

## 🤝 Contributing

This is a personal portfolio project, but suggestions are welcome! Feel free to open an issue.

## 📄 License

MIT License - feel free to use this as inspiration for your own projects!

## 👩‍💻 Author

**Dana W. Martinez**
- Software Engineering Intern @ Cooperation.org
- Working with LinkedClaims and AI-powered trust systems

## 🙏 Acknowledgments

- Built as part of internship with [Cooperation.org](https://cooperation.org)
- Uses [LinkedClaims](https://identity.foundation/labs-linkedclaims/) standard
- Backend integration with LinkedTrust network
- Special thanks to Golda Velez for guidance

---

**Built with ❤️ using Next.js, TypeScript, and LinkedTrust**