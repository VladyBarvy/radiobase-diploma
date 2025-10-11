// import React, { useState } from 'react';
// import Sidebar from './components/Sidebar';
// import ComponentList from './components/ComponentList';
// import './styles/App.css';
// import chipIcon from './assets/picto-chip.png';

// function App() {
//   const [selectedCategory, setSelectedCategory] = useState(null);
//   const [selectedComponent, setSelectedComponent] = useState(null);

//   const handleComponentSelect = (component) => {
//     setSelectedComponent(component);
//   };

//   return (
//     <div className="app">
//       <Sidebar
//         selectedCategory={selectedCategory}
//         onCategorySelect={setSelectedCategory}
//         onComponentSelect={handleComponentSelect}
//       />

//       <main className="main-content">
//         <div className="content-wrapper">
//           {selectedComponent ? (
//             <ComponentList
//               category={selectedCategory}
//               component={selectedComponent}
//             />
//           ) : selectedCategory ? (
//             <div className="welcome-message">
//               <img src={chipIcon} alt="Микросхема" className="welcome-icon" />
//               <h1>Выберите компонент из категории "{selectedCategory}"</h1>
//               <p>или создайте новый компонент</p>
//               <div className="divider"></div>
//             </div>
//           ) : (
//             <div className="welcome-message">
//               <img src={chipIcon} alt="Микросхема" className="welcome-icon" />
//               <h1>Выберите компонент для просмотра</h1>
//               <p>или создайте новый компонент</p>
//               <div className="divider"></div>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   )
// }

// export default App






































import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import ComponentList from './components/ComponentList';
import './styles/App.css';
import chipIcon from './assets/picto-chip.png';

function App() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedComponent, setSelectedComponent] = useState(null);

  const handleComponentSelect = (component) => {
    setSelectedComponent(component);
  };

  return (
    <div className="app">
      <Sidebar
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        onComponentSelect={handleComponentSelect}
      />

      <main className="main-content">
        <div className="content-wrapper">
          {selectedComponent ? (
            <ComponentList
              category={selectedCategory}
              component={selectedComponent}
            />
          ) : selectedCategory ? (
            <div className="welcome-message">
              <img src={chipIcon} alt="Микросхема" className="welcome-icon" />
              {/* Исправлено: selectedCategory.name вместо selectedCategory */}
              <h1>Выберите компонент из категории "{selectedCategory.name}"</h1>
              <p>или создайте новый компонент</p>
              <div className="divider"></div>
            </div>
          ) : (
            <div className="welcome-message">
              <img src={chipIcon} alt="Микросхема" className="welcome-icon" />
              <h1>Выберите компонент для просмотра</h1>
              <p>или создайте новый компонент</p>
              <div className="divider"></div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
