import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme, AppBar, Toolbar, Button, IconButton } from '@mui/material';
import LeetCodeQuestionsViewer from './components/LeetCodeQuestionsViewer';
import AttemptedQuestionsTracker from './components/AttemptedQuestionsTracker';
import { Brightness4, Brightness7 } from '@mui/icons-material';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Create theme with light or dark mode based on state
  const theme = createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light', // Toggle theme mode
    },
  });

  // Toggle dark mode state
  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppBar
          position="static"
          sx={{
            backgroundColor: darkMode ? '#333' : '#104bc9',
            height: '100px', // Set AppBar height
          }}
        >
          <Toolbar
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'row', // Arrange items horizontally
              justifyContent: 'space-between', // Distribute buttons evenly
              alignItems: 'center', // Center links vertically
            }}
          >
            <div>
              <Button  component={Link} to="/" 
                  sx={{ mx: 2 , 
                        color: '#fff',
                        fontWeight: 'bold',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#0056b3',
                        },
                      
                      }}
              >
                All Questions
              </Button>
              <Button  component={Link} to="/attempted" 
                  sx={{ mx: 2 , 
                        color: '#fff',
                        fontWeight: 'bold',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        transition: 'background-color 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#0056b3',
                        },
                      
                      }}
              >
                 Attempted Questions
              </Button>
              
            </div>
            <IconButton color="inherit" onClick={toggleDarkMode}>
              {darkMode ? <Brightness7 /> : <Brightness4 />} {/* Switch icon based on mode */}
            </IconButton>
          </Toolbar>
        </AppBar>

        <div className="App">
          <Routes>
            <Route path="/" element={<LeetCodeQuestionsViewer />} />
            <Route path="/attempted" element={<AttemptedQuestionsTracker />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}

export default App;
