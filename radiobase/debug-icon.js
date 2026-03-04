const fs = require('fs')
const path = require('path')
const { app, BrowserWindow, nativeImage } = require('electron')

app.whenReady().then(() => {
  console.log('🔍 ICON DEBUGGER')
  console.log('='.repeat(50))
  
  // Проверяем все возможные пути
  const paths = [
    path.join(__dirname, 'resources/icon_3.ico'),
    path.join(__dirname, 'resources/icon_3.png'),
    path.join(process.resourcesPath, 'resources/icon_3.ico'),
    path.join(process.resourcesPath, 'icon_3.ico'),
    path.join(app.getAppPath(), 'resources/icon_3.ico'),
    path.join(process.cwd(), 'resources/icon_3.ico')
  ]
  
  console.log('📁 Checking paths:')
  paths.forEach(p => {
    const exists = fs.existsSync(p)
    console.log(`  ${p}: ${exists ? '✅' : '❌'}`)
    
    if (exists) {
      try {
        const stats = fs.statSync(p)
        console.log(`    Size: ${stats.size} bytes`)
        
        const icon = nativeImage.createFromPath(p)
        console.log(`    Image size: ${icon.getSize().width}x${icon.getSize().height}`)
        console.log(`    Is empty: ${icon.isEmpty()}`)
      } catch (e) {
        console.log(`    Error: ${e.message}`)
      }
    }
  })
  
  console.log('='.repeat(50))
  console.log('🪟 Creating test window...')
  
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    icon: paths[0] // Используем первый путь
  })
  
  win.loadURL('about:blank')
  
  console.log('✅ Window created, check if icon appears')
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
