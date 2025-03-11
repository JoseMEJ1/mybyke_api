const express = require('express');
const cors = require('cors');
const app = express();
const db = require('./connection'); 

app.use(cors());
app.use(express.json());
app.get("/api/select/:tabla/:id", async (req, res) => {
    try {
        const { tabla, id } = req.params;
        const idColumn = `id_${tabla}`; 
        const query = `SELECT * FROM ${tabla} WHERE ${idColumn} = $1`;

        const resultado = await db.query(query, [id]);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar el registro' });
    }
});
app.get("/api/selectodo/:tabla", async (req, res) => {
    try {
        const { tabla } = req.params;
        const resultado = await db.query(`SELECT * FROM ${tabla}`);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar los registros' });
    }
});
app.post("/api/insertar/:tabla", async (req, res) => {
    try {
        const { tabla } = req.params;
        const datos = req.body;

        if (!datos || Object.keys(datos).length === 0) {
            return res.status(400).json({ error: "No se enviaron datos para insertar" });
        }

        const columnas = Object.keys(datos);
        const valores = Object.values(datos);
        const placeholders = columnas.map((_, index) => `$${index + 1}`).join(", ");

        const query = `
            INSERT INTO ${tabla} (${columnas.join(", ")})
            VALUES (${placeholders})
            RETURNING *;
        `;

        const resultado = await db.query(query, valores);
        res.json({ mensaje: "Datos insertados correctamente", registro: resultado.rows[0] });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al insertar los datos" });
    }
});
app.put("/api/actualizar/:tabla/:id", async (req, res) => {
    try {
        const { tabla, id } = req.params;
        const datos = req.body;

        if (!datos || Object.keys(datos).length === 0) {
            return res.status(400).json({ error: "No se enviaron datos para actualizar" });
        }

        const idColumn = `id_${tabla}`;
        const campos = Object.keys(datos).map((col, index) => `${col} = $${index + 1}`).join(", ");
        const valores = Object.values(datos);

        const query = `
            UPDATE ${tabla}
            SET ${campos}
            WHERE ${idColumn} = $${valores.length + 1}
            RETURNING *;
        `;

        valores.push(id);
        const resultado = await db.query(query, valores);
        res.json({ mensaje: "Datos actualizados correctamente", registro: resultado.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al actualizar los datos' });
    }
});
app.delete("/api/delete/:tabla/:id", async (req, res) => {
    try {
        const { tabla, id } = req.params;
        const idColumn = `id_${tabla}`;
        const query = `DELETE FROM ${tabla} WHERE ${idColumn} = $1`;

        await db.query(query, [id]);
        res.json({ mensaje: "Registro eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar el registro' });
    }
});
app.get("/api/saludo", (req, res) => {
    res.json({ mensaje: "Hola mundo" });
});

app.get("/api/dato/:id", (req, res) => {
    console.log(req.params.id);
    res.json({ id: req.params.id });
});

app.get("/api/nombre/:nombre", (req, res) => {
    res.json({ nombre: "Hola " + req.params.nombre });
});

app.post("/api/post", (req, res) => {
    console.log(req.body.nombre);
    console.log(req.body.apellido);
    console.log(req.body.edad);
    res.json({});
});
app.listen(3000, () => {
    console.log('Servidor escuchando en el puerto 3000');
});
