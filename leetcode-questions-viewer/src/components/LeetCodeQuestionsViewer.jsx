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
  Checkbox,
} from '@mui/material';
import { green } from '@mui/material/colors';
import { useDebounce } from 'use-debounce';

// Utility function for caching
const createCache = () => {
  const cache = new Map();
  return {
    get: (key) => cache.get(key),
    set: (key, value) => cache.set(key, value),
    has: (key) => cache.has(key),
  };
};
const csvCache = createCache();

const LeetCodeQuestionsViewer = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500); 
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [attemptedQuestions, setAttemptedQuestions] = useState(() => {
    const saved = localStorage.getItem('attemptedLeetCodeQuestions');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('attemptedLeetCodeQuestions', JSON.stringify(attemptedQuestions));
  }, [attemptedQuestions]);


  const loadCompanyData = async (companyName) => {
    if (csvCache.has(companyName)) {
      return csvCache.get(companyName);
    }

    try {
      const csvModules = import.meta.glob('../data/data/*.csv');
      const csvPath = Object.keys(csvModules).find((path) => path.includes(companyName));
      if (!csvPath) return null;

      const csvModule = await csvModules[csvPath]();
      const csvText = await fetch(csvModule.default).then((r) => r.text());
      const results = Papa.parse(csvText, { header: true, dynamicTyping: true });

      const companyData = {
        name: companyName,
        questions: results.data.filter((q) => q.Title), // Remove empty rows
      };

      csvCache.set(companyName, companyData);
      return companyData;
    } catch (error) {
      console.error(`Error loading data for ${companyName}:`, error);
      return null;
    }
  };

  // Preload first 50 companies on initial render
  useEffect(() => {
    const preloadCompanies = async () => {
      setLoading(true);
      const csvModules = import.meta.glob('../data/data/*.csv');
      const allCompanies = Object.keys(csvModules)
        .map((path) => path.split('/').pop().replace('.csv', ''))
        .slice(0, 50); // Load the first 50 companies

      const companyDataPromises = allCompanies.map(loadCompanyData);
      const loadedCompanies = (await Promise.all(companyDataPromises)).filter(Boolean);

      setCompanies(loadedCompanies);
      setLoading(false);
    };

    preloadCompanies();
  }, []);

  // Handle search-triggered dynamic loading
  useEffect(() => {
    const handleSearch = async () => {
      if (!debouncedSearchTerm) {
        
        setLoading(false);
        return;
      }
  
      // Remove all spaces from the search term
      const sanitizedSearchTerm = debouncedSearchTerm.replace(/\s+/g, '');
  
      setLoading(true);
      const csvModules = import.meta.glob('../data/data/*.csv');
      const matchingCompanies = Object.keys(csvModules)
        .map((path) => path.split('/').pop().replace('.csv', ''))
        .filter(
          (name) =>
            name.toLowerCase().startsWith(sanitizedSearchTerm.toLowerCase()) // Match by prefix
        );
  
      const companyDataPromises = matchingCompanies.map(loadCompanyData);
      const loadedCompanies = (await Promise.all(companyDataPromises)).filter(Boolean);
  
      setCompanies(loadedCompanies);
      setLoading(false);
    };
  
    handleSearch();
  }, [debouncedSearchTerm]);
  

  const filteredQuestions = useMemo(() => {
    return companies.flatMap((company) =>
      company.questions.map((q) => ({ ...q, companyName: company.name }))
    );
  }, [companies]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAttemptToggle = (question) => {
    const questionId = question.ID;
    const updatedAttemptedQuestions = {
      ...attemptedQuestions,
      [questionId]: !attemptedQuestions[questionId],
    };

    setAttemptedQuestions(updatedAttemptedQuestions);

    if (updatedAttemptedQuestions[questionId]) {
      localStorage.setItem(`leetcode_question_${questionId}`, JSON.stringify(question));
    } else {
      localStorage.removeItem(`leetcode_question_${questionId}`);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'success';
      case 'Medium':
        return 'warning';
      case 'Hard':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" flexDirection="column">
        <CircularProgress />
        <Typography variant="h6" sx={{ marginTop: 2 }}>
          Searching, please wait...
        </Typography>
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

      {filteredQuestions.length > 0 ? (
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
              {filteredQuestions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((question, index) => (
                <TableRow key={index}>
                  <TableCell>{question.companyName.toUpperCase()}</TableCell>
                  <TableCell>{question.ID}</TableCell>
                  <TableCell>
                    <a href={`https://leetcode.com${question.URL}`} target="_blank" rel="noopener noreferrer">
                      {question.Title}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Chip label={question.Difficulty} color={getDifficultyColor(question.Difficulty)} size="small" />
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
      ) : (
        <Typography>No questions found.</Typography>
      )}
    </Box>
  );
};

export default LeetCodeQuestionsViewer;
