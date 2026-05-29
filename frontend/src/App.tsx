import { Routes, Route } from 'react-router-dom'
import { NavBar } from './components/NavBar'
import HomePage from './pages/HomePage'
import { AppPage } from './pages/AppPage'
import { ArchitecturePage } from './pages/ArchitecturePage'
import { DemoPage } from './pages/DemoPage'

function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app" element={<AppPage />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/demo" element={<DemoPage />} />
        {/* Fallback — redirect unknown paths to home */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </>
  )
}

export default App
