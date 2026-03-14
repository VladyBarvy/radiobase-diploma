import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { FaEdit } from 'react-icons/fa';
import '../styles/ComponentList.css';
import ImageModal from '../utils/ImageModal';

import {
  useRenderDebug,
  createPerformanceMeasure,
  formatDateOptimized,
  ParametersTable
} from '../utils/CompListUtils';

import {
  FaFilePdf
} from 'react-icons/fa';



const ComponentList = ({ category, component, onEdit, onDataUpdate, version, onPdfUpdate }) => {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfVersion, setPdfVersion] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState(null);


  if (!component) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('ℹ️ ComponentList: No component selected');
    }
    return (
      <div className="component-view">
        <div className="text-center text-muted mt-5">
          <i className="fas fa-microchip fa-3x mb-3"></i>
          <h4>Компонент не выбран</h4>
          <p>Выберите компонент из списка слева</p>
        </div>
      </div>
    );
  }






  // СТАБИЛИЗИРУЕМ ПРОПСЫ
  const stableCategory = useMemo(() => category, [category?.id]);


  const stableComponent = useMemo(() => {
    // Добавляем pdfVersion в зависимости для обновления при изменении PDF
    return component;
  }, [component, version, pdfVersion]);



  // ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ ОТЛАДКИ
  useRenderDebug('ComponentList', {
    category: stableCategory,
    component: stableComponent
  });




  // ОПТИМИЗИРОВАННЫЕ ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ
  const componentName = useMemo(() => {
    const name = stableComponent?.name;
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧮 Computing componentName:', name);
    }
    return name;
  }, [stableComponent?.name]);

  const categoryName = useMemo(() => {
    const name = stableComponent?.category_name || stableCategory?.name || 'Неизвестно';
    if (process.env.NODE_ENV !== 'production') {
      console.log('🧮 Computing categoryName:', name);
    }
    return name;
  }, [stableComponent?.category_name, stableCategory?.name]);

  // ОПТИМИЗИРОВАННОЕ ФОРМАТИРОВАНИЕ ДАТЫ
  const formattedDate = useMemo(() => {
    const measurePerf = createPerformanceMeasure('formatDate');
    const result = formatDateOptimized(stableComponent?.updated_at);
    measurePerf();
    return result;
  }, [stableComponent?.updated_at]);

  // ОПТИМИЗИРОВАННЫЙ ПАРСИНГ ПАРАМЕТРОВ
  const parameters = useMemo(() => {
    const measurePerf = createPerformanceMeasure('parseParameters');

    const getParametersObject = (params) => {
      if (!params) return {};

      if (process.env.NODE_ENV !== 'production') {
        console.group('🔧 Parameter Parsing Debug');
        console.log('📨 Raw parameters:', params);
        console.log('📊 Parameters type:', typeof params);
      }

      let result = {};

      try {
        if (typeof params === 'string') {
          result = JSON.parse(params);
        } else if (typeof params === 'object') {
          result = params;
        }

        if (process.env.NODE_ENV !== 'production') {
          console.log('✅ Successfully parsed parameters');
        }
      } catch (error) {
        console.error('❌ Failed to parse parameters:', error);
        result = {};
      } finally {
        if (process.env.NODE_ENV !== 'production') {
          console.groupEnd();
        }
      }

      return result;
    };

    const parsed = getParametersObject(stableComponent?.parameters);
    measurePerf();
    return parsed;
  }, [stableComponent?.parameters]);

  // ОПТИМИЗИРОВАННЫЕ УСЛОВИЯ РЕНДЕРИНГА
  const renderConditions = useMemo(() => {
    const conditions = {
      hasDescription: !!stableComponent?.description,
      hasParameters: Object.keys(parameters).length > 0,
      hasImage: !!stableComponent?.image_data,
      hasDatasheet: !!stableComponent?.datasheet_url,
      componentProvided: !!stableComponent
    };

    if (process.env.NODE_ENV !== 'production') {
      console.group('🎯 Render Conditions');
      console.log('📝 Has description:', conditions.hasDescription);
      console.log('⚙️ Has parameters:', conditions.hasParameters, `(${Object.keys(parameters).length} items)`);
      console.log('🖼️ Has image:', conditions.hasImage);
      console.log('🔗 Has datasheet:', conditions.hasDatasheet);
      console.log('📦 Component provided:', conditions.componentProvided);
      console.groupEnd();
    }

    return conditions;
  }, [stableComponent, parameters]);

  // ОПТИМИЗИРОВАННЫЕ ОБРАБОТЧИКИ
  const handleEditClick = useCallback(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.group('✏️ Edit Component Clicked');
      console.log('📋 Component:', stableComponent);
      console.log('🎯 Category:', stableCategory);
      console.groupEnd();
    }

    onEdit?.(stableComponent);
  }, [onEdit, stableComponent, stableCategory]);

  const handleUpdateImage = useCallback(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('🖼️ Opening image update modal');
    }
    setIsImageModalOpen(true);
  }, []);

  const handleCloseImageModal = useCallback(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('❌ Closing image update modal');
    }
    setIsImageModalOpen(false);
    setImagePreview(null);
  }, []);





  const handleSaveImage = useCallback(async (newImagePreview) => {
    if (!newImagePreview) {
      console.warn('⚠️ No image preview to save');
      return;
    }

    const measurePerf = createPerformanceMeasure('saveImage');

    try {
      if (process.env.NODE_ENV !== 'production') {
        console.group('💾 Saving Component Image');
        console.log('🖼️ Image preview exists:', !!newImagePreview);
        console.log('📋 Target component:', stableComponent?.id);
      }

      const updatedComponent = {
        ...stableComponent,
        image_data: newImagePreview,
        updated_at: new Date().toISOString()
      };

      const result = await window.api.database.updateComponent(updatedComponent);

      if (result.success) {
        console.log('✅ Image saved successfully');
        setImagePreview(newImagePreview);
        onEdit?.(updatedComponent);
        handleCloseImageModal();
      } else {
        console.error('❌ Failed to update image:', result.error);
        alert('Не удалось обновить изображение');
      }
    } catch (error) {
      console.error('❌ Error updating image:', error);
      alert('Ошибка при обновлении изображения');
    } finally {
      if (process.env.NODE_ENV !== 'production') {
        console.groupEnd();
      }
      measurePerf();
    }
  }, [stableComponent, onEdit, handleCloseImageModal]);




  const handleDatasheetClick = useCallback(async (e, url) => {
    e.preventDefault();
    const measurePerf = createPerformanceMeasure('openDatasheet');

    if (!url) {
      console.warn('⚠️ Datasheet URL is empty');
      alert('Ссылка на datasheet не указана');
      return;
    }

    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    if (process.env.NODE_ENV !== 'production') {
      console.group('🌐 Opening Datasheet');
      console.log('🔗 Original URL:', url);
      console.log('🔗 Normalized URL:', normalizedUrl);
    }

    try {
      if (window.electron?.shell) {
        console.log('🖥️ Using Electron shell');
        window.electron.shell.openExternal(normalizedUrl);
      } else if (window.api?.window?.openBrowser) {
        console.log('🪟 Using API browser window');
        const result = await window.api.window.openBrowser(normalizedUrl);
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        console.log('🌐 Using default window.open');
        window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
      }

      console.log('✅ Datasheet opened successfully');
    } catch (error) {
      console.error('❌ Error opening datasheet:', error);
      console.log('🔄 Falling back to default window.open');
      window.open(normalizedUrl, '_blank', 'noopener,noreferrer');
    } finally {
      if (process.env.NODE_ENV !== 'production') {
        console.groupEnd();
      }
      measurePerf();
    }
  }, []);

  // ОБЪЕДИНЕННЫЙ useEffect ДЛЯ ОТЛАДКИ
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.group('🔍 ComponentList Full State');
      console.log('📦 Current component:', stableComponent);
      console.log('🏷️ Current category:', stableCategory);
      console.log('🖼️ Image modal open:', isImageModalOpen);
      console.log('🖼️ Image preview exists:', !!imagePreview);
      console.log('📝 Has description:', renderConditions.hasDescription);
      console.log('⚙️ Parameter count:', Object.keys(parameters).length);
      console.groupEnd();
    }
  }, [stableComponent, stableCategory, isImageModalOpen, imagePreview, renderConditions, parameters]);




// useEffect для отслеживания изменений в пропсе component
useEffect(() => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔄 Component prop changed:', component?.id, component?.name);
  }
  
  // Сбрасываем локальные состояния при смене компонента
  setImagePreview(null);
  setPdfLoading(false);
  setPdfVersion(prev => prev + 1); // Увеличиваем версию для перезагрузки PDF
  
}, [component?.id]); // Следим только за ID компонента



// useEffect для проверки актуальности данных (без вызова onEdit)
useEffect(() => {
  const checkForUpdates = async () => {
    if (component?.id) {
      try {
        console.log('🔄 Checking for fresh component data for ID:', component.id);
        const freshData = await window.api.database.getComponent(component.id);
        
        if (freshData) {
          // Сравниваем текущие данные с новыми
          const currentData = stableComponent;
          const hasChanges = JSON.stringify(currentData) !== JSON.stringify(freshData);
          
          if (hasChanges) {
            console.log('📝 Component data changed, but NOT opening edit modal');
            console.log('  Old:', currentData);
            console.log('  New:', freshData);
            
            if (onDataUpdate) {
              // Если есть специальный пропс для обновления данных
              onDataUpdate(freshData);
            } else {
              // Если нет специального пропса, просто логируем
              console.log('⚠️ Data changed but no onDataUpdate handler provided');
            }
          }
        }
      } catch (error) {
        console.error('❌ Error refreshing component data:', error);
      }
    }
  };

  checkForUpdates();
}, [component?.id, version, pdfVersion]);










  // ПРОФИЛИРОВАНИЕ ВРЕМЕНИ РЕНДЕРА
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      const renderStart = performance.now();

      return () => {
        const renderEnd = performance.now();
        const renderTime = renderEnd - renderStart;

        console.log(`🎨 ComponentList render time: ${renderTime.toFixed(2)}ms`);

        if (renderTime > 50) {
          console.warn(`🐢 Slow render detected: ${renderTime.toFixed(2)}ms`);
        }
      };
    }
  });

  // Если компонент не выбран, показываем placeholder
  if (!stableComponent || typeof stableComponent !== 'object') {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ ComponentList: No valid component provided, showing placeholder');
    }

    return (
      <div className="component-view">
        <div className="text-center text-muted mt-5">
          <i className="fas fa-microchip fa-3x mb-3"></i>
          <h4>Выберите компонент для просмотра</h4>
          <p>или создайте новый компонент</p>
        </div>
      </div>
    );
  }



 


  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.group('🔍 ComponentList Full State');
      console.log('📦 Current component:', stableComponent);
      console.log('🏷️ Current category:', stableCategory);
      console.log('🖼️ Image modal open:', isImageModalOpen);
      console.log('🖼️ Image preview exists:', !!imagePreview);
      console.log('📝 Has description:', renderConditions.hasDescription);
      console.log('⚙️ Parameter count:', Object.keys(parameters).length);
      console.log('📄 Has PDF flag:', stableComponent?.has_pdf);
      console.log('📄 PDF file path:', stableComponent?.pdf_file_path);
      console.log('📄 PDF filename:', stableComponent?.pdf_filename);
      console.groupEnd();
    }
  }, [stableComponent, stableCategory, isImageModalOpen, imagePreview, renderConditions, parameters]);



  const PdfViewer = ({ component, onEdit }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const openPdf = async () => {
      if (!component?.id || !component?.pdf_file_path) {
        setError('PDF файл не найден');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const result = await window.api.database.getComponentPdf(component.id); // Получаем PDF данные

        if (result.success) {
          // Создаем Blob из данных
          const blob = new Blob([result.data], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);

          window.api.window.openBrowser(url); // Открываем в новом окне
        } else {
          setError('Не удалось загрузить PDF файл');
        }
      } catch (error) {
        console.error('❌ Error opening PDF:', error);
        setError('Ошибка при открытии PDF');
      } finally {
        setLoading(false);
      }
    };

    if (!component?.pdf_file_path) {
      return null;
    }

    return (

      <div >
        <button
          className="btn-open-pdf"
          onClick={openPdf}
          disabled={loading}
        >
          <FaFilePdf size={14} />
          {loading ? 'Загрузка...' : 'Открыть PDF'}
        </button>
        {error && <div className="pdf-error">{error}</div>}
      </div>
    );
  };






  return (
    <div className="component-view">
      {/* Карточка компонента */}
      <div className="component-card">
        {/* Заголовок с названием компонента и кнопкой редактирования */}
        <div className="component-header">
          <h1 className="component-title">{componentName}</h1>
          <button
            className="btn-edit-component"
            onClick={handleEditClick}
            title="Редактировать компонент"
          >
            <FaEdit size={14} />
            Редактировать
          </button>
        </div>

        <div className="component-content">
          {/* Верхний блок: основная информация + изображение */}
          <div className="top-section">
            {/* Левая колонка - основная информация */}
            <div className="info-section">
              <div className="info-row">
                <span className="info-label">Категория:</span>
                <span className="info-value">{categoryName}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Ячейка:</span>
                <span className="info-value">{stableComponent.storage_cell || '-'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Ссылка:</span>
                <span className="info-value">
                  {renderConditions.hasDatasheet ? (
                    <a
                      href={stableComponent.datasheet_url}
                      onClick={(e) => handleDatasheetClick(e, stableComponent.datasheet_url)}
                      className="datasheet-link"
                    >
                      Открыть
                    </a>
                  ) : '-'}
                </span>
              </div>




              <div className="info-row">
                <span className="info-label">PDF-документ:</span>
                <>
                  <PdfViewer component={component} />
                </>
              </div>



              <div className="info-row">
                <span className="info-label">Количество:</span>
                <span className="info-value">{stableComponent.quantity || 0}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Обновлён:</span>
                <span className="info-value">{formattedDate}</span>
              </div>
            </div>

            {/* Правая колонка - изображение */}
            <div className="image-section-right">
              {renderConditions.hasImage ? (
                <div className="image-container">
                  <img
                    src={stableComponent.image_data}
                    className="component-image"
                    alt={componentName}
                  />
                  <div>
                    <button
                      className="button-update-image"
                      onClick={handleUpdateImage}
                    >
                      <FaEdit size={14} />
                      Обновить изображение
                    </button>
                  </div>
                </div>
              ) : (
                <div className="image-placeholder">
                  <i className="fas fa-image fa-3x mb-2"></i>
                  <p className="text-muted mb-2">Нет изображения</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleUpdateImage}
                  >
                    <i className="fas fa-plus me-1"></i>Добавить
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Описание */}
          {renderConditions.hasDescription && (
            <>
              <div className="description-section">
                <h2 className="section-title">Описание</h2>
                <div className="description-content">
                  {stableComponent.description}
                </div>
              </div>
              <div className="divider"></div>
            </>
          )}

          {/* Раздел "Параметры" */}
          <div className="parameters-section-full">
            <h2 className="section-title">Параметры</h2>
            <ParametersTable parameters={parameters} />
          </div>
        </div>
      </div>





      {/* Модальное окно для обновления изображения */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={handleCloseImageModal}
        onSave={handleSaveImage}
        imagePreview={imagePreview}
        component={stableComponent}
        hasImage={renderConditions.hasImage}
      />
    </div>
  );
};

export default React.memo(ComponentList);
