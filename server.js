const express = require('express');
const dotenv = require('dotenv');
const { Pool } = require('pg');
//const multer = require('multer');

dotenv.config();

//Express application
const app = express();
const port = process.env.PORT || 3000; // Using the port from .env or default to 3000

// PostgreSQL connection configuration
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Testing database connection
pool.connect()
  .then(() => console.log('Connected to PostgreSQL database!'))
  .catch(err => console.error('Error connecting to PostgreSQL:', err));

// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'uploads/'); // destination folder
//     },
//     filename: (req, file, cb) => {
//       // You might want to generate a unique filename to avoid conflicts
//       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//       const fileExtension = file.originalname.split('.').pop();
//       cb(null, file.fieldname + '-' + uniqueSuffix + '.' + fileExtension);
//     }
// });
  
//const upload = multer({ storage: storage });

//route 1
//dashboard route
app.get('/', (req, res) => {
    res.send('Welcome to the AI Career Coach Dashboard!');
});

// //route 2
// // Defining resume upload route
// app.post('/api/resumes/upload', upload.single('resume'), (req, res) => {
//     if (!req.file) {
//       return res.status(400).send('No resume file uploaded.');
//     }
//     // here, 'req.file' contains information about the uploaded file
//     console.log('Uploaded file:', req.file);
//     // we can now process the file (e.g., save it, extract text, etc.)
//     res.send('Resume uploaded successfully!');
//   });

//route 3
//saving user information in database
app.post('/api/cover-letter/generate', express.json(), async (req, res) => {
    const {
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      acquiredSkills,
      professionalSummary,
      educationDetails,
      jobTitle,
      jobDescription,
    } = req.body;
  
    if (!jobTitle || !jobDescription) {
      return res.status(400).send('Please provide the job title and job description.');
    }
  
    // Basic template incorporating the new fields
    const generatedCoverLetter = `[Your Name]\n[Your Address]\n[Your Phone]\n[Your Email]\n\n[Date]\n\n[Hiring Manager Name] (If known, otherwise use title)\n[Hiring Manager Title]\n[Company Name]\n[Company Address]\n\nDear [Mr./Ms./Mx. Last Name or Hiring Manager Title],\n\nI am writing to express my keen interest in the ${jobTitle} position at [Company Name], as advertised [Platform where you saw the ad, if applicable].\n\nMy background, as reflected in my LinkedIn profile (${linkedinUrl}), GitHub repository (${githubUrl}), and portfolio (${portfolioUrl}), aligns well with the requirements outlined in the job description:\n\n${jobDescription}\n\nMy professional summary highlights: ${professionalSummary}\n\nKey skills I have acquired include: ${acquiredSkills}\n\nMy education details are as follows: ${educationDetails}\n\n[Here you could add a paragraph or two further detailing how your skills and experience match specific points in the job description. You can also mention your enthusiasm for the company and the role based on your understanding of the job description.]\n\nThank you for your time and consideration. I have attached my resume for your review and welcome the opportunity to discuss my qualifications further.\n\nSincerely,\n[Your Name]`;
  
    try {
      const query = `
        INSERT INTO cover_letter_inputs (
          linkedin_url,
          github_url,
          portfolio_url,
          acquired_skills,
          professional_summary,
          education_details,
          job_title,
          job_description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `;
      const values = [
        linkedinUrl,
        githubUrl,
        portfolioUrl,
        acquiredSkills,
        professionalSummary,
        educationDetails,
        jobTitle,
        jobDescription,
      ];
  
      await pool.query(query, values);
      console.log('Cover letter input stored in the database.');
  
      res.json({ coverLetter: generatedCoverLetter, message: 'Cover letter generated and input stored successfully!' });
  
    } catch (error) {
      console.error('Error storing cover letter input:', error);
      res.status(500).send('Error storing cover letter input.');
    }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});