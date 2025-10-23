const errorHandler = (err, req, res, next) => {
  console.error('🚨 Error global:', err);

  // Error de validación
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      details: err.details
    });
  }

  // Error de Slack
  if (err.message.includes('Slack') || err.message.includes('webhook')) {
    return res.status(502).json({
      success: false,
      error: 'Error de comunicación con Slack'
    });
  }

  // Error de base de datos
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      error: 'El registro ya existe'
    });
  }

  // Error genérico
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;