/*Main app logic (routing between pages)*/


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chatbot from './pages/Chatbot'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Chatbot />} /> {/* default page */}
      </Routes>
    </Router>
  );
}

export default App;