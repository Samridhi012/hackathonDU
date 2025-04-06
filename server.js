const express = require('express');
const dotenv = require('dotenv');
const { Pool } = require('pg');
//const multer = require('multer');
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const { spawn } = require('child_process');

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

//route 2
//saving user information in database for COVER LETTER
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

//route 3
//route to handle INDUSTRY INSIGHTS
app.post('/api/industry-insights/generate-path', express.json(), async (req, res) => {
  const { destination, currentLearningPath } = req.body;

  if (!destination || !currentLearningPath) {
    return res.status(400).send('Please provide both your destination and current learning path.');
  }

  //generating remaining learning path
  const generatedLearningPath = generateLearningPath(destination, currentLearningPath);

  if (generatedLearningPath) {
    res.json({ learningPath: generatedLearningPath });
  } else {
    res.status(404).send('Could not generate a learning path based on the input.');
  }
});

//route 4
//connecting backend to ML code
app.post('/api/generate-documents', async (req, res) => {
  const {
    name,
    email,
    mobile,
    linkedin,
    github,
    portfolio,
    skill_set,
    professional_summary,
    education,
    projects,
    extra_curricular,
    soft_skills,
    job_title,
    job_description,
  } = req.body;

  // Construct the arguments to pass to the Python script
  const pythonScriptPath = 'path/to/your/script.py'; // Replace with the actual path to your Python script

  const pythonProcess = spawn('python', [
    pythonScriptPath,
    JSON.stringify({ // Pass the input data as a JSON string argument
      name,
      email,
      mobile,
      linkedin,
      github,
      portfolio,
      skill_set,
      professional_summary,
      education,
      projects,
      extra_curricular,
      soft_skills,
      job_title,
      job_description,
    }),
  ]);

  let outputData = '';
  let errorData = '';

  // Collect the output from the Python script
  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });

  // Collect any errors from the Python script
  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
  });

  // Handle the completion of the Python script
  pythonProcess.on('close', (code) => {
    if (code === 0) {
      try {
        const result = JSON.parse(outputData); // Assuming your Python script returns JSON
        res.json(result);
      } catch (error) {
        console.error('Error parsing Python output:', error);
        res.status(500).send('Error processing the generated documents.');
      }
    } else {
      console.error('Python script execution failed with code:', code);
      console.error('Python error output:', errorData);
      res.status(500).send('Error generating documents.');
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});