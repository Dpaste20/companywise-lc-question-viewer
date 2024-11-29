/*
currently the 

*/ 

import React, { useState, useMemo, useEffect } from 'react';
import { Box, Typography, TextField, Chip, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination } from '@mui/material';
import { green } from '@mui/material/colors';
import { useDebounce } from 'use-debounce'; 



const AttemptedQuestionsTracker = () => {
  const [attemptedQuestions, setAttemptedQuestions] = useState(() => {
    const saved = localStorage.getItem('attemptedLeetCodeQuestions');
    return saved ? JSON.parse(saved) : {};
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500); // Debounce search term with 500ms delay
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const attemptedQuestionsArray = useMemo(() => {
    return Object.entries(attemptedQuestions)
      .filter(([_, isAttempted]) => isAttempted)
      .map(([questionId]) => {
        const questionDetails = localStorage.getItem(`leetcode_question_${questionId}`);
        return questionDetails ? JSON.parse(questionDetails) : { ID: questionId };
      })
      .filter(q => q.Title) // Ensure we only show questions with full details
      .filter(q => 
        !debouncedSearchTerm || 
        q.Title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        q.ID?.toString().includes(debouncedSearchTerm) ||
        q.Difficulty?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        q.companyName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
  }, [attemptedQuestions, debouncedSearchTerm]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRemoveAttempted = (questionId) => {
    const updatedAttemptedQuestions = { ...attemptedQuestions };
    delete updatedAttemptedQuestions[questionId];
    setAttemptedQuestions(updatedAttemptedQuestions);
    localStorage.setItem('attemptedLeetCodeQuestions', JSON.stringify(updatedAttemptedQuestions));
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Easy': return 'success';
      case 'Medium': return 'warning';
      case 'Hard': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Attempted LeetCode Questions
      </Typography>
      
      <TextField
        label="Search Attempted Questions"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // Update search term as user types
      />

      {attemptedQuestionsArray.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', marginTop: 4 }}>
          No attempted questions yet. Start solving LeetCode problems!
        </Typography>
      ) : (
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
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {attemptedQuestionsArray
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((question, index) => (
                  <TableRow key={index}>
                    <TableCell>{question.companyName?.toUpperCase() || 'N/A'}</TableCell>
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
                    <TableCell>{question['Acceptance %'] || 'N/A'}</TableCell>
                    <TableCell>{question['Frequency %'] || 'N/A'}</TableCell>
                    <TableCell>{question['Is Premium'] === 'Y' ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        size="small"
                        onClick={() => handleRemoveAttempted(question.ID)}
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={attemptedQuestionsArray.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default AttemptedQuestionsTracker;


/*
currently the attempted questions is taken from the local storage , in futher development I will try to fetch it from the google drive ; as currently my exams is going on :)

*/ 

