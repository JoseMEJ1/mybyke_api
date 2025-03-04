const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

const db = require('./connection'); // Asegúrate de tener configurado tu módulo de conexión a la BD

// Seleccionar un registro por id en una tabla (nota: esta ruta requiere ajustes si se va a usar)
app.get("/api/select/:id.:tabla", async (request, response) => {
    try {
        const { id, tabla } = request.params;
        const query = `SELECT * FROM ${tabla} WHERE id_personaje = $1`;
        const resultado = await db.query(query, [id]);
        response.json(resultado.rows);
    } catch (error) {
        console.log(error);
        response.status(500).json({ error: 'Error al consultar el registro' });
    }
});

// Seleccionar todos los registros de una tabla
app.get("/api/selectodo/:tabla", async (request, response) => {
    try {
        const { tabla } = request.params;
        const resultado = await db.query(`SELECT * FROM ${tabla}`);
        response.json(resultado.rows);
    } catch (error) {
        console.log(error);
        response.status(500).json({ error: 'Error al consultar los registros' });
    }
});

// Insertar datos en una tabla (se omite id_personaje, ya que es serial)
app.post("/api/insertar/:tabla", async (request, response) => {
    try {
        const { tabla } = request.params;
        const { nombre, edad, pais_origen, oficio } = request.body;
        const query = `
            INSERT INTO ${tabla} (nombre, edad, pais_origen, oficio)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const resultado = await db.query(query, [nombre, edad, pais_origen, oficio]);
        response.json({ mensaje: 'Datos insertados correctamente', registro: resultado.rows[0] });
    } catch (error) {
        console.log(error);
        response.status(500).json({ error: 'Error al insertar los datos' });
    }
});

// Actualizar datos en una tabla
app.put("/api/actualizar/:tabla", async (request, response) => {
    try {
        const { tabla } = request.params;
        const { id_personaje, nombre, edad, pais_origen, oficio } = request.body;
        const query = `
            UPDATE ${tabla}
            SET nombre = $1, edad = $2, pais_origen = $3, oficio = $4
            WHERE id_personaje = $5
            RETURNING *
        `;
        const resultado = await db.query(query, [nombre, edad, pais_origen, oficio, id_personaje]);
        response.json({ mensaje: 'Datos actualizados correctamente', registro: resultado.rows[0] });
    } catch (error) {
        console.log(error);
        response.status(500).json({ error: 'Error al actualizar los datos' });
    }
});

// Eliminar un registro de una tabla
app.delete("/api/delete/:id.:tabla", async (request, response) => {
    try {
        const { id, tabla } = request.params;
        const query = `DELETE FROM ${tabla} WHERE id_personaje = $1`;
        await db.query(query, [id]);
        response.json({ mensaje: 'Registro eliminado correctamente' });
    } catch (error) {
        console.log(error);
        response.status(500).json({ error: 'Error al eliminar el registro' });
    }
});

// Otras rutas de ejemplo
app.get("/api/saludo", (request, response) => {
    response.json({ mensaje: "hola mundo" });
});

app.get("/api/dato/:id", (request, response) => {
    console.log(request.params.id);
    response.json({ id: request.params.id });
});

app.get("/api/nombre/:nombre", (request, response) => {
    response.json({ nombre: "hola " + request.params.nombre });
});

app.post("/api/post", (req, res) => {
    console.log(req.body.nombre);
    console.log(req.body.apellido);
    console.log(req.body.edad);
    res.json({});
});

app.listen(3000, (err) => {
    console.log('Listening on port 3000');
});
