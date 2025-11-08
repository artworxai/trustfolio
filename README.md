# 🎓 TrustFolio

**Student Achievement Portfolio using LinkedClaims**

TrustFolio is a modern web application that allows students to create and manage verifiable claims about their achievements, skills, and projects. Built with the LinkedClaims standard for trust and verification.

![TrustFolio](https://img.shields.io/badge/Next.js-16.0-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-93.6%25-blue?style=flat&logo=typescript)
![Status](https://img.shields.io/badge/Status-Active-green)

## ✨ Features

- 📝 **Create Achievements** - Log projects, skills, and certifications
- ⭐ **Star Ratings** - Rate your proficiency level (1-5 stars)
- 🏆 **Portfolio View** - Beautiful card-based display of all achievements
- 💾 **Local Storage** - Stores claims in browser (API integration ready)
- 🎨 **Modern UI** - Responsive design with Tailwind CSS
- 🔗 **LinkedClaims Ready** - Built to integrate with LinkedTrust network

## 🚀 Tech Stack

- **Framework:** Next.js 16.0 (App Router)
- **Language:** TypeScript
- **UI Library:** React 19
- **Styling:** Tailwind CSS
- **HTTP Client:** Axios
- **Storage:** LocalStorage (demo) / LinkedTrust API (future)

## 📸 Screenshots

### Home Page
Clean landing page with clear call-to-action

### Create Achievement
Easy form to log your accomplishments

### Portfolio View
Beautiful display of all your achievements with ratings

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

3. Run development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

1. **Create an Achievement**
   - Click "Create Achievement" on the home page
   - Select category (Project, Skill, or Certification)
   - Describe your achievement
   - Rate your proficiency (1-5 stars)
   - Set the date

2. **View Portfolio**
   - Click "View Portfolio" to see all your achievements
   - Claims display in a card grid with emoji indicators
   - Each card shows: category, description, rating, and dates

## 🔮 Future Enhancements

- [ ] Authentication (email/OAuth)
- [ ] Publish claims to LinkedTrust network
- [ ] Share portfolio via unique URL
- [ ] Export to PDF
- [ ] Endorsements from others
- [ ] GitHub integration for automatic project claims
- [ ] LinkedIn export

## 🏗️ Architecture
```
trustfolio/
├── app/
│   ├── page.tsx              # Home page
│   ├── create/
│   │   └── page.tsx          # Create achievement form
│   └── portfolio/
│       └── page.tsx          # Portfolio display
├── lib/
│   └── linkedclaims.ts       # Claims management & API client
└── components/               # Future reusable components
```

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
- Inspired by the need for verifiable student achievements

---

**Built with ❤️ using Next.js, TypeScript, and LinkedClaims**