const express = require('express');
const neo4j = require('neo4j-driver');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// informações do Neo4j Aura
const uri = 'neo4j+s://4f0a08b9.databases.neo4j.io';
const user = 'neo4j';
const password = 'oxKXNnsRco5jZ7tuGuuM3vsb8UGyeC3JquYCwd4zslM';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// Criar um nó
app.post('/api/nodes', async (req, res) => {
  const session = driver.session();
  const { name, label } = req.body;
  try {
    const result = await session.run(
      `CREATE (n:${label} {name: $name}) RETURN n`,
      { name }
    );
    const node = result.records[0].get('n').properties;
    res.status(201).json(node);
  } catch (error) {
    console.error('Error creating node:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await session.close();
  }
});

// Ler todos os nós
app.get('/api/nodes', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run('MATCH (n) RETURN n');
    const nodes = result.records.map(record => ({
      data: { id: record.get('n').identity.toString(), label: record.get('n').labels[0], name: record.get('n').properties.name }
    }));
    res.json(nodes);
  } catch (error) {
    console.error('Error querying Neo4j:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await session.close();
  }
});

// Criar uma aresta
app.post('/api/edges', async (req, res) => {
  const session = driver.session();
  const { sourceId, targetId } = req.body;
  try {
    await session.run(
      'MATCH (source), (target) WHERE id(source) = $sourceId AND id(target) = $targetId CREATE (source)-[:CONNECTED_TO]->(target)',
      { sourceId: parseInt(sourceId), targetId: parseInt(targetId) }
    );
    res.status(201).send('Edge created successfully');
  } catch (error) {
    console.error('Error creating edge:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await session.close();
  }
});

  // Excluir um nó
  app.delete('/api/nodes/:id', async (req, res) => {
    const session = driver.session();
    const { id } = req.params;
    try {
      await session.run(
        'MATCH (n) WHERE id(n) = $id DETACH DELETE n',
        { id: parseInt(id) }
      );
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting node:', error);
      res.status(500).send('Internal Server Error');
    } finally {
      await session.close();
    }
  });
  
  // Excluir uma aresta
  app.delete('/api/edges/:id', async (req, res) => {
    const session = driver.session();
    const { id } = req.params;
    try {
      await session.run(
        'MATCH ()-[r]-() WHERE id(r) = $id DELETE r',
        { id: parseInt(id) }
      );
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting edge:', error);
      res.status(500).send('Internal Server Error');
    } finally {
      await session.close();
    }
  });

// Ler todas as arestas
app.get('/api/edges', async (req, res) => {
  const session = driver.session();
  try {
    const result = await session.run('MATCH ()-[r]->() RETURN r');
    const edges = result.records.map(record => ({
      data: { id: record.get('r').identity.toString(), source: record.get('r').start.toString(), target: record.get('r').end.toString() }
    }));
    res.json(edges);
  } catch (error) {
    console.error('Error querying edges:', error);
    res.status(500).send('Internal Server Error');
  } finally {
    await session.close();
  }
});

app.listen(8000, () => {
  console.log('Server is running on http://localhost:8000');
});
