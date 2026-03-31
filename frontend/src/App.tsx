import shadowSwapHtml from '../../shadowswap.html?raw'

function App() {
  return (
    <iframe
      srcDoc={shadowSwapHtml}
      title="ShadowSwap"
      style={{
        border: '0',
        display: 'block',
        height: '100vh',
        width: '100%',
      }}
    />
  )
}

export default App
