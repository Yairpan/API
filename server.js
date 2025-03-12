const mysql = require("mysql2");
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    allowedHeaders: "Content-Type",
  })
);

app.use(express.static(path.join(__dirname, "backend", "public")));


const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "dailydb",
});

connection.connect((err) => {
  if (err) {
    console.error("Error conectando a MySQL:", err);
    return;
  }
  console.log("Conexión exitosa a la base de datos MySQL");

  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS login_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL,
            login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

  connection.query(createTableQuery, (err) => {
    if (err) {
      console.error("Error creando la tabla login_logs:", err);
    } else {
      console.log("Tabla login_logs lista.");
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "index.html"));
});


app.post("/login", (req, res) => {
  console.log("🔹 Se recibió una petición en /login");
  console.log("Cuerpo de la petición:", req.body);

  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" });
  }

  const sql = "SELECT * FROM usuario WHERE BINARY Nombre = ? AND BINARY Contraseña = ?";
  connection.query(sql, [username.trim(), password.trim()], (err, results) => {
    if (err) {
      console.error("Error en la consulta de autenticación:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    if (results.length === 0) {
      console.log("Inicio de sesión fallido: credenciales incorrectas.");
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    console.log(`Usuario ${username} autenticado correctamente.`);

    
    const logQuery = "INSERT INTO login_logs (username) VALUES (?)";
    connection.query(logQuery, [username.trim()], (err) => {
      if (err) {
        console.error("Error registrando el login:", err);
      }
    });

    return res.json({ message: "Autenticación satisfactoria" });
  });
});


app.get("/usuarios", (req, res) => {
  connection.query("SELECT * FROM usuario", (err, results) => {
    if (err) {
      console.error("Error obteniendo usuarios:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
    res.json(results);
  });
});


app.get("/usuarios/:id", (req, res) => {
  const userId = req.params.id;
  connection.query("SELECT * FROM usuario WHERE idUsuario = ?", [userId], (err, results) => {
    if (err) {
      console.error("Error obteniendo usuario:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    res.json(results[0]);
  });
});


app.post("/usuarios", (req, res) => {
  const { nombre, email, contraseña, edad, ciudad_de_residencia } = req.body;

  if (!nombre || !email || !contraseña || !edad || !ciudad_de_residencia) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const sql = "INSERT INTO usuario (Nombre, Email, Contraseña, Edad, Ciudad_de_residencia) VALUES (?, ?, ?, ?, ?)";
  connection.query(sql, [nombre, email, contraseña, edad, ciudad_de_residencia], (err, result) => {
    if (err) {
      console.error("Error creando usuario:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
    res.status(201).json({ message: "Usuario creado correctamente", id: result.insertId });
  });
});


app.post("/gastos", (req, res) => {
  console.log("🔹 Se recibió una petición en /gastos");
  console.log("Cuerpo de la petición completa:", req.body);

  let { monto, descripcion, fecha, categoria_id } = req.body;

  
  console.log(`monto recibido:`, monto);
  console.log(`descripcion recibida:`, descripcion);
  console.log(`fecha recibida:`, fecha);
  console.log(`categoria_id recibido:`, categoria_id);

  
  monto = parseFloat(monto);
  categoria_id = parseInt(categoria_id);

  if (!monto || isNaN(monto)) console.log("⚠️ monto no es válido");
  if (!descripcion || descripcion.trim() === "") console.log("⚠️ descripcion no es válida");
  if (!fecha || fecha.trim() === "") console.log("⚠️ fecha no es válida");
  if (!categoria_id || isNaN(categoria_id)) console.log("⚠️ categoria_id no es válido");

  if (!monto || isNaN(monto) || !descripcion || descripcion.trim() === "" || !fecha || fecha.trim() === "" || !categoria_id || isNaN(categoria_id)) {
    return res.status(400).json({ error: "Todos los campos son obligatorios y deben ser válidos" });
  }

  const sql = "INSERT INTO gasto (Monto, Descripcion, Fecha_Gasto, Categoria_idCategoria) VALUES (?, ?, ?, ?)";
  connection.query(sql, [monto, descripcion.trim(), fecha.trim(), categoria_id], (err, result) => {
    if (err) {
      console.error("Error al insertar gasto:", err.sqlMessage);
      return res.status(500).json({ error: "Error en el servidor", detalle: err.sqlMessage });
    }

    console.log("Gasto registrado correctamente con ID:", result.insertId);
    res.status(201).json({ message: "Gasto registrado correctamente", id: result.insertId });
  });
});


app.get("/gastos", (req, res) => {
  const sql = "SELECT * FROM gasto";
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error obteniendo los gastos:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
    res.json(results);
  });
});


app.post("/presupuestos", (req, res) => {
  const { monto, fecha_inicio, fecha_fin } = req.body;

  if (!monto || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const sql = "INSERT INTO presupuesto (Monto, Fecha_Inicio, Fecha_Fin) VALUES (?, ?, ?)";
  connection.query(sql, [monto, fecha_inicio, fecha_fin], (err, result) => {
    if (err) {
      console.error("Error al crear el presupuesto:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    res.status(201).json({ message: "Presupuesto creado correctamente", id: result.insertId });
  });
});

app.post("/presupuestos", (req, res) => {
  const { monto, fecha_inicio, fecha_fin } = req.body;

  if (!monto || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: "Todos los campos son obligatorios" });
  }

  const sql = "INSERT INTO presupuesto (Monto, Fecha_Inicio, Fecha_Fin) VALUES (?, ?, ?)";
  connection.query(sql, [monto, fecha_inicio, fecha_fin], (err, result) => {
    if (err) {
      console.error("Error al crear el presupuesto:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }

    res.status(201).json({ message: "Presupuesto creado correctamente", id: result.insertId });
  });
});


app.get("/presupuestos", (req, res) => {
  const sql = "SELECT * FROM presupuesto";
  
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error obteniendo los presupuestos:", err);
      return res.status(500).json({ error: "Error en el servidor" });
    }
    res.json(results);
  });
});



app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "backend", "public", "login.html"));
});


const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

