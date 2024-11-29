
import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Box, 
  TextField,
  Chip,
  TablePagination,
  CircularProgress,
  Checkbox
} from '@mui/material';
import { green } from '@mui/material/colors';

// Utility function for caching
const createCache = () => {
  const cache = new Map();
  return {
    get: (key) => cache.get(key),
    set: (key, value) => cache.set(key, value),
    has: (key) => cache.has(key)
  };
};
const csvCache = createCache();

const LeetCodeQuestionsViewer = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // New state for tracking attempted questions
  const [attemptedQuestions, setAttemptedQuestions] = useState(() => {
    // Load attempted questions from localStorage on initial render
    const saved = localStorage.getItem('attemptedLeetCodeQuestions');
    return saved ? JSON.parse(saved) : {};
  });

  // Effect to save attempted questions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('attemptedLeetCodeQuestions', JSON.stringify(attemptedQuestions));
  }, [attemptedQuestions]);

  useEffect(() => {
    const loadCompanyData = async () => {
      const companiesData = [];
      
      // Use import.meta.glob for Vite
      const csvModules = import.meta.glob('../data/data/*.csv');
      
      try {
        for (const path in csvModules) {
          // Check cache first
          if (csvCache.has(path)) {
            companiesData.push(csvCache.get(path));
            continue;
          }

          // If not in cache, load the CSV
          const csvModule = await csvModules[path]();
          const csvText = await fetch(csvModule.default).then(r => r.text());
          
          const results = Papa.parse(csvText, { 
            header: true,
            dynamicTyping: true // Convert numeric strings to numbers
          });

          const companyName = path.split('/').pop().replace('.csv', '');
          const companyData = {
            name: companyName,
            questions: results.data.filter(q => q.Title) // Remove empty rows
          };

          // Cache the result
          csvCache.set(path, companyData);
          companiesData.push(companyData);
        }

        setCompanies(companiesData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading CSV files:', error);
        setLoading(false);
      }
    };

    loadCompanyData();
  }, []);

  // Memoized filtered questions
  const filteredQuestions = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return companies.flatMap(company => 
      company.questions.filter(q => 
        q.Title?.toLowerCase().includes(term) ||
        q.ID?.toString().includes(term) ||
        q.Difficulty?.toLowerCase().includes(term) ||
        company.name.toLowerCase().includes(term)
      ).map(q => ({...q, companyName: company.name}))
    );
  }, [companies, searchTerm]);

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handler for toggling question attempt status
  const handleAttemptToggle = (question) => {
    const questionId = question.ID;
    const updatedAttemptedQuestions = {
      ...attemptedQuestions,
      [questionId]: !attemptedQuestions[questionId]
    };
    
    setAttemptedQuestions(updatedAttemptedQuestions);

    // Store full question details in localStorage when marked as attempted
    if (updatedAttemptedQuestions[questionId]) {
      localStorage.setItem(`leetcode_question_${questionId}`, JSON.stringify(question));
    } else {
      // Optional: Remove question details if unmarked
      localStorage.removeItem(`leetcode_question_${questionId}`);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'error';
      default: return 'default';
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        LeetCode Questions Viewer
      </Typography>
      
      <TextField
        label="Search Questions"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Company</TableCell>
              <TableCell>ID</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Acceptance %</TableCell>
              <TableCell>Frequency %</TableCell>
              <TableCell>Premium</TableCell>
              <TableCell align="right">Attempted</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredQuestions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((question, index) => (
                <TableRow key={index}>
                  <TableCell>{question.companyName.toUpperCase()}</TableCell>
                  <TableCell>{question.ID}</TableCell>
                  <TableCell>
                    <a 
                      href={`https://leetcode.com${question.URL}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {question.Title}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={question.Difficulty} 
                      color={getDifficultyColor(question.Difficulty)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{question['Acceptance %']}</TableCell>
                  <TableCell>{question['Frequency %']}</TableCell>
                  <TableCell>{question['Is Premium'] === 'Y' ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <Checkbox
                      checked={!!attemptedQuestions[question.ID]}
                      onChange={() => handleAttemptToggle(question)}
                      sx={{
                        color: green[600],
                        '&.Mui-checked': {
                          color: green[600],
                        },
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredQuestions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
    </Box>
  );
};

export default LeetCodeQuestionsViewer;