const express = require('express');
const cors = require('cors');
const db = require('./connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración del servidor
app.use(cors());
app.use(express.json());

// Crear servidor HTTP
const server = app.listen(PORT, () => {
  console.log(`Servidor API ejecutándose en el puerto ${PORT}`);
});

// ==============================================
// 1. Autenticación y Gestión de Usuarios
// ==============================================

// Registrar nuevo usuario
app.post('/api/auth/registro', async (req, res) => {
  try {
    const { primer_nombre, apellido_paterno, apellido_materno, correo, contraseña, nombre_usuario, fecha_nacimiento, sexo } = req.body;
    
    const result = await db.query(
      'SELECT * FROM registrar_usuario($1, $2, $3, $4, $5, $6, $7, $8)',
      [primer_nombre, apellido_paterno, apellido_materno || null, correo, contraseña, sexo, nombre_usuario, fecha_nacimiento]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Iniciar sesión
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Se requieren correo y contraseña" });
    }

    // 1. Primero verificar si el usuario existe
    const userResult = await db.query(
      'SELECT id_usuario, primer_nombre, correo, contraseña, rol, estatus FROM usuario WHERE correo = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = userResult.rows[0];

    // 2. Verificar la contraseña (en producción usa bcrypt.compare)
    if (user.contraseña !== password) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    // 3. Verificar si el usuario está activo
    if (!user.estatus) {
      return res.status(403).json({ error: "Cuenta desactivada" });
    }

    // 4. Si todo está bien, devolver los datos del usuario
    res.json({
      id: user.id_usuario,
      name: user.primer_nombre,
      email: user.correo,
      role: user.rol,
      status: user.estatus,
      // En producción deberías generar un token JWT aquí
      token: 'simulated-token-for-development'
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: "Error del servidor durante el login" });
  }
});

// Validar campos únicos
app.get('/api/auth/validar-campo', async (req, res) => {
  try {
    const { field, value, userId } = req.query;
    
    const result = await db.query(
      'SELECT * FROM validar_campo_unico($1, $2, $3)',
      [field, value, userId || null]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener perfil del usuario
app.get('/api/usuarios/mi-perfil', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const result = await db.query(
      'SELECT * FROM obtener_perfil_usuario($1)',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar perfil
app.put('/api/usuarios/mi-perfil', async (req, res) => {
  try {
    const { userId, primer_nombre, apellido_paterno, apellido_materno, correo, nombre_usuario, fecha_nacimiento, sexo } = req.body;
    
    const result = await db.query(
      'SELECT * FROM actualizar_perfil($1, $2, $3, $4, $5, $6, $7, $8)',
      [userId, primer_nombre, apellido_paterno, apellido_materno || null, correo, nombre_usuario, fecha_nacimiento, sexo]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Cambiar contraseña
app.post('/api/usuarios/mi-perfil/cambiar-contrasena', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    
    const result = await db.query(
      'SELECT * FROM cambiar_contrasena($1, $2, $3)',
      [userId, currentPassword, newPassword]
    );
    
    if (!result.rows[0].exito) {
      return res.status(400).json({ error: result.rows[0].mensaje });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// 2. Gestión de Bicicletas
// ==============================================

// Obtener bicicletas del usuario
app.get('/api/bicicletas', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const result = await db.query(
      'SELECT * FROM obtener_bicicletas_usuario($1)',
      [userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener detalles de bicicleta
app.get('/api/bicicletas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM obtener_detalles_bicicleta($1)',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bicicleta no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vincular bicicleta
app.post('/api/bicicletas/vincular', async (req, res) => {
  try {
    const { bikeCode, userId } = req.body;
    
    const result = await db.query(
      'SELECT * FROM vincular_bicicleta_usuario($1, $2)',
      [bikeCode, userId]
    );
    
    if (!result.rows[0].exito) {
      return res.status(400).json({ error: result.rows[0].mensaje });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Activar bicicleta
app.post('/api/bicicletas/:id/activar', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM activar_bicicleta($1)',
      [id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Desactivar bicicleta
app.post('/api/bicicletas/:id/desactivar', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM desactivar_bicicleta($1)',
      [id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar ubicación
app.post('/api/bicicletas/:id/ubicacion', async (req, res) => {
  try {
    const { id } = req.params;
    const { latitud, longitud } = req.body;
    
    const result = await db.query(
      'SELECT * FROM actualizar_ubicacion_bicicleta($1, $2, $3)',
      [id, latitud, longitud]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Historial de ubicaciones
app.get('/api/bicicletas/:id/historial-ubicaciones', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50 } = req.query;
    
    const result = await db.query(
      'SELECT * FROM obtener_historial_ubicaciones($1, $2)',
      [id, limit]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// 3. Funciones de Seguridad
// ==============================================

// Obtener impactos
app.get('/api/bicicletas/:id/impactos', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM obtener_impactos_bicicleta($1)',
      [id]
    );
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Botón de pánico
app.post('/api/bicicletas/:id/boton-panico', async (req, res) => {
  try {
    const { id } = req.params;
    const { activar, latitud, longitud } = req.body;
    
    let result;
    if (activar) {
      result = await db.query(
        'SELECT * FROM activar_boton_panico($1, $2, $3)',
        [id, latitud, longitud]
      );
    } else {
      result = await db.query(
        'SELECT * FROM desactivar_boton_panico($1)',
        [id]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bloqueo por ubicación
app.post('/api/bicicletas/:id/bloqueo-ubicacion', async (req, res) => {
  try {
    const { id } = req.params;
    const { activar, latitud, longitud } = req.body;
    
    let result;
    if (activar) {
      result = await db.query(
        'SELECT * FROM activar_bloqueo_ubicacion($1, $2, $3)',
        [id, latitud, longitud]
      );
    } else {
      result = await db.query(
        'SELECT * FROM desactivar_bloqueo_ubicacion($1)',
        [id]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// 4. Gestión de Contactos de Emergencia
// ==============================================

// Obtener contactos
app.get('/api/contactos-emergencia', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM obtener_contactos_emergencia()');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Agregar contacto
app.post('/api/contactos-emergencia', async (req, res) => {
  try {
    const { nombres, apellido_paterno, apellido_materno, correo, parentesco, telefono } = req.body;
    
    const result = await db.query(
      'SELECT * FROM agregar_contacto_emergencia($1, $2, $3, $4, $5, $6)',
      [nombres, apellido_paterno, apellido_materno || null, correo, parentesco, telefono]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar contacto
app.put('/api/contactos-emergencia/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombres, apellido_paterno, apellido_materno, correo, parentesco, telefono } = req.body;
    
    const result = await db.query(
      'SELECT * FROM actualizar_contacto_emergencia($1, $2, $3, $4, $5, $6, $7)',
      [id, nombres, apellido_paterno, apellido_materno || null, correo, parentesco, telefono]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar contacto
app.delete('/api/contactos-emergencia/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM eliminar_contacto_emergencia($1)',
      [id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==============================================
// 5. Endpoints de Administración
// ==============================================

// Listar usuarios (admin)
app.get('/api/admin/usuarios', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM admin_obtener_usuarios()');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Crear usuario (admin)
app.post('/api/admin/usuarios', async (req, res) => {
  try {
    const { primer_nombre, apellido_paterno, apellido_materno, correo, contraseña, sexo, nombre_usuario, fecha_nacimiento, rol } = req.body;
    
    const result = await db.query(
      'SELECT * FROM admin_crear_usuario($1, $2, $3, $4, $5, $6, $7, $8, $9)',
      [primer_nombre, apellido_paterno, apellido_materno || null, correo, contraseña, sexo, nombre_usuario, fecha_nacimiento, rol]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar usuario (admin)
app.put('/api/admin/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { primer_nombre, apellido_paterno, apellido_materno, correo, sexo, nombre_usuario, fecha_nacimiento, rol, estatus } = req.body;
    
    const result = await db.query(
      'SELECT * FROM admin_actualizar_usuario($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [id, primer_nombre, apellido_paterno, apellido_materno || null, correo, sexo, nombre_usuario, fecha_nacimiento, rol, estatus]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Listar bicicletas (admin)
app.get('/api/admin/bicicletas', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM admin_obtener_bicicletas()');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Registrar bicicleta (admin)
app.post('/api/admin/bicicletas', async (req, res) => {
  try {
    const { nombre, id_usuario, codigo_unico, id_admin_registro } = req.body;
    
    const result = await db.query(
      'SELECT * FROM admin_registrar_bicicleta($1, $2, $3, $4)',
      [nombre, id_usuario, codigo_unico, id_admin_registro]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Actualizar bicicleta (admin)
app.put('/api/admin/bicicletas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, id_usuario, codigo_unico } = req.body;
    
    const result = await db.query(
      'SELECT * FROM admin_actualizar_bicicleta($1, $2, $3, $4)',
      [id, nombre, codigo_unico, id_usuario]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar bicicleta (admin)
app.delete('/api/admin/bicicletas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT * FROM admin_eliminar_bicicleta($1)',
      [id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ==============================================
// 2. Gestión de Bicicletas (versión con consultas directas)
// ==============================================

// Obtener bicicletas del usuario (consulta directa)
app.get('/api/bicicletas/usuario/:id_usuario', async (req, res) => {
  try {
    const { id_usuario } = req.params;
    
    const result = await db.query(
      'SELECT id_bicicleta, nombre, codigo_unico, activo FROM bicicleta WHERE id_usuario = $1',
      [id_usuario]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No se encontraron bicicletas para este usuario" });
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener bicicletas:', error);
    res.status(500).json({ error: "Error al obtener las bicicletas del usuario" });
  }
});

// Obtener ubicación de bicicleta (consulta directa)
app.get('/api/gps/:id_bicicleta', async (req, res) => {
  try {
    const { id_bicicleta } = req.params;
    
    const result = await db.query(
      'SELECT id_gps, latitud, longitud, fecha FROM gps WHERE id_bici = $1 ORDER BY fecha DESC LIMIT 1',
      [id_bicicleta]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No se encontraron datos de ubicación" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al obtener ubicación:', error);
    res.status(500).json({ error: "Error al obtener la ubicación" });
  }
});

// Activar/desactivar bicicleta (consulta directa)
app.post('/api/bicicletas/:id/activar', async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    const result = await db.query(
      'UPDATE bicicleta SET activo = $1 WHERE id_bicicleta = $2 RETURNING *',
      [activo, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Botón de pánico (consulta directa)
app.post('/api/bicicletas/:id/boton-panico', async (req, res) => {
  try {
    const { id } = req.params;
    const { activo, latitud, longitud } = req.body;
    
    const result = await db.query(
      'UPDATE boton_de_panico SET activo = $1, latitud = $2, longitud = $3 WHERE id_bici = $4 RETURNING *',
      [activo, latitud, longitud, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Bloqueo por ubicación (consulta directa)
app.post('/api/bicicletas/:id/bloqueo-ubicacion', async (req, res) => {
  try {
    const { id } = req.params;
    const { activo, latitud, longitud } = req.body;
    
    const result = await db.query(
      'UPDATE bloqueo_ubicacion SET activo = $1, latitud = $2, longitud = $3 WHERE id_bici = $4 RETURNING *',
      [activo, latitud, longitud, id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener estado de bloqueo (consulta directa)
app.get('/api/bicicletas/:id/bloqueo-ubicacion', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT activo, latitud, longitud FROM bloqueo_ubicacion WHERE id_bici = $1',
      [id]
    );
    
    res.json(result.rows[0] || { activo: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Botón de pánico (consulta directa) - FIXED VERSION
app.get('/api/bicicletas/:id/boton-panico', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT activo, latitud, longitud FROM boton_de_panico WHERE id_bici = $1',
      [id]
    );
    
    res.json(result.rows[0] || { activo: false });
  } catch (error) {
    console.error('Error en botón de pánico:', error);
    res.status(500).json({ 
      error: "Error al obtener estado del botón de pánico",
      details: error.message 
    });
  }
});

app.post('/api/bicicletas/:id/boton-panico', async (req, res) => {
  try {
    const { id } = req.params;
    const { activar, latitud, longitud } = req.body;
    
    if (typeof activar !== 'boolean') {
      return res.status(400).json({ error: "El campo 'activar' debe ser booleano" });
    }

    const result = await db.query(
      `UPDATE boton_de_panico 
       SET activo = $1, latitud = $2, longitud = $3 
       WHERE id_bici = $4 
       RETURNING *`,
      [activar, latitud, longitud, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Bicicleta no encontrada" });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en botón de pánico:', error);
    res.status(500).json({ 
      error: "Error al actualizar botón de pánico",
      details: error.message 
    });
  }
});
// In your server.js or routes file
app.get('/api/admin/usuarios', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM usuario');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});
app.get('/api/admin/usuarios', async (req, res) => {
  console.log('Received request for /api/admin/usuarios');
  try {
    console.log('Attempting database query...');
    const result = await db.query('SELECT * FROM usuario');
    console.log('Query successful, rows:', result.rows.length);
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error.message 
    });
  }
});