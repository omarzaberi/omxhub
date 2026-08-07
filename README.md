# OMXHub

<div align="center">

# 🤖 OMXHub

**Discover. Create. Simplify.**

Arabic AI Tools Directory, Prompt Library, and Free PDF Tools built with Astro.

🌐 **Website:** https://omxhub.com

</div>

---

## 📖 About

OMXHub is an open-source platform focused on helping Arabic users discover the best AI tools, learn how to use them, compare services, and access free browser-based PDF utilities.

### Features

- 🤖 AI Tools Directory
- ⚖️ AI Comparisons
- 💬 Prompt Library
- 📄 Free PDF Tools (Browser-based)
- 🌍 Arabic & English Support
- 🌙 Dark Mode
- ⚡ Fast Static Website (Astro)
- 🔍 SEO Optimized

---

## 🛠 Tech Stack

- Astro
- TypeScript
- React
- Tailwind CSS
- MD/MDX Content Collections
- Netlify
- Cloudflare

---

## 🚀 Local Development

```bash
npm install
npm run dev
```

The development server will be available at:

```
http://localhost:4321
```

### Production Build

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

## 📁 Project Structure

```
src/
 ├── components/
 ├── content/
 │    ├── tools/
 │    ├── prompts/
 │    └── comparisons/
 ├── layouts/
 ├── pages/
 └── styles/
```

---

## ➕ Adding a New AI Tool

Create a new Markdown file inside:

```
src/content/tools/
```

Example:

```
chatgpt.md
claude.md
gemini.md
```

Fill in the required frontmatter fields.

The page will automatically be generated under:

```
/ai-tools/your-file-name
```

---

## 💬 Adding a New Prompt

Create a Markdown file inside:

```
src/content/prompts/
```

The page will be generated automatically.

---

## ⚖️ Adding a Comparison

Create a Markdown file inside:

```
src/content/comparisons/
```

Example:

```
chatgpt-vs-claude.md
```

---

## 📄 PDF Tools

The PDF utilities run entirely inside the browser.

No user files are uploaded to a server.

---

## 📦 Git Commands

Clone the repository:

```bash
git clone https://github.com/omxhub/omxhub.git
```

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

---

## 🚀 Deployment

OMXHub is deployed using **Netlify**.

Every push to the `main` branch automatically triggers a new deployment.

---

## 🌍 Live Website

https://omxhub.com

---

## 🤝 Contributing

Contributions are welcome!

If you'd like to improve OMXHub:

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

Made with ❤️ by **Omar Zaberi**

</div>
