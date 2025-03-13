import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Container, Row, Col, Card, Badge, Button, Modal, Form } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

// Configuration constants
const COLUMN_CONFIG = {
  BACKLOG: { id: 'backlog', title: 'Backlog' },
  TO_DO: { id: 'to-do', title: 'To Do' },
  IN_PROGRESS: { id: 'in-progress', title: 'In Progress' },
  REVIEW: { id: 'review', title: 'Review' },
  DONE: { id: 'done', title: 'Done' }
};

// Start with empty task object
const INITIAL_TASKS = {};

// Initial columns with empty task arrays
const INITIAL_COLUMNS = {
  [COLUMN_CONFIG.BACKLOG.id]: {
    ...COLUMN_CONFIG.BACKLOG,
    taskIds: [],
  },
  [COLUMN_CONFIG.TO_DO.id]: {
    ...COLUMN_CONFIG.TO_DO,
    taskIds: [],
  },
  [COLUMN_CONFIG.IN_PROGRESS.id]: {
    ...COLUMN_CONFIG.IN_PROGRESS,
    taskIds: [],
  },
  [COLUMN_CONFIG.REVIEW.id]: {
    ...COLUMN_CONFIG.REVIEW,
    taskIds: [],
  },
  [COLUMN_CONFIG.DONE.id]: {
    ...COLUMN_CONFIG.DONE,
    taskIds: [],
  },
};

const INITIAL_DATA = {
  tasks: INITIAL_TASKS,
  columns: INITIAL_COLUMNS,
  columnOrder: Object.values(COLUMN_CONFIG).map(col => col.id),
};

const STYLES = {
  CARD_MIN_HEIGHT: '200px',
  COL_MD: 2, // Changed to 2 to accommodate 5 columns (12/5 ≈ 2.4, rounded down to 2)
};

const STORAGE_KEY = 'kanbanData';
const TASK_ID_PREFIX = 'task-';

export default function KanbanBoard() {
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    return savedData ? JSON.parse(savedData) : INITIAL_DATA;
  });
  const [showModal, setShowModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskContent, setNewTaskContent] = useState('');
  const [selectedColumn, setSelectedColumn] = useState(COLUMN_CONFIG.TO_DO.id);

  const updateStateAndStorage = (newData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  };

  const onDragEnd = (result) => {
    console.log("onDragEnd",result);
    
    const { destination, source, draggableId } = result;
    
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }

    const startColumn = data.columns[source.droppableId];
    const finishColumn = data.columns[destination.droppableId];
    console.log(startColumn,"start column",finishColumn,"finishcolumn");
    
    if (startColumn === finishColumn) {
      const newTaskIds = Array.from(startColumn.taskIds);
      newTaskIds.splice(source.index, 1);
      newTaskIds.splice(destination.index, 0, draggableId);

      const newColumn = {
        ...startColumn,
        taskIds: newTaskIds,
      };

      const newData = {
        ...data,
        columns: {
          ...data.columns,
          [newColumn.id]: newColumn,
        },
      };
      
      updateStateAndStorage(newData);
      return;
    }

    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStart = {
      ...startColumn,
      taskIds: startTaskIds,
    };

    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinish = {
      ...finishColumn,
      taskIds: finishTaskIds,
    };

    const newData = {
      ...data,
      columns: {
        ...data.columns,
        [newStart.id]: newStart,
        [newFinish.id]: newFinish,
      },
    };
    
    updateStateAndStorage(newData);
  };

  const handleCreateTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTaskId = `${TASK_ID_PREFIX}${Date.now()}`;
    const newTask = {
      id: newTaskId,
      title: newTaskTitle,
      content: newTaskContent,
    };

    const newData = {
      ...data,
      tasks: {
        ...data.tasks,
        [newTaskId]: newTask,
      },
      columns: {
        ...data.columns,
        [selectedColumn]: {
          ...data.columns[selectedColumn],
          taskIds: [...data.columns[selectedColumn].taskIds, newTaskId],
        },
      },
    };

    updateStateAndStorage(newData);
    
    setNewTaskTitle('');
    setNewTaskContent('');
    setSelectedColumn(COLUMN_CONFIG.TO_DO.id);
    setShowModal(false);
  };

  const handleDeleteTask = (taskId, columnId) => {
    // Remove task from tasks object
    const newTasks = { ...data.tasks };
    delete newTasks[taskId];

    // Remove taskId from column's taskIds array
    const newTaskIds = data.columns[columnId].taskIds.filter(id => id !== taskId);
    
    const newData = {
      ...data,
      tasks: newTasks,
      columns: {
        ...data.columns,
        [columnId]: {
          ...data.columns[columnId],
          taskIds: newTaskIds,
        },
      },
    };

    updateStateAndStorage(newData);
  };
  console.log(data,"data");
  
  return (
    <Container fluid className="py-4">
      <Button 
        variant="success" 
        className="mb-4"
        onClick={() => setShowModal(true)}
      >
        Create Task
      </Button>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Task</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleCreateTask}>
            <Form.Group className="mb-3" controlId="taskTitle">
              <Form.Label>Task Title</Form.Label>
              <Form.Control
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Enter task title"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="taskContent">
              <Form.Label>Description</Form.Label>
              <Form.Control
                type="text"
                value={newTaskContent}
                onChange={(e) => setNewTaskContent(e.target.value)}
                placeholder="Enter task description"
              />
            </Form.Group>
            <Form.Group className="mb-3" controlId="columnSelect">
              <Form.Label>Column</Form.Label>
              <Form.Select
                value={selectedColumn}
                onChange={(e) => setSelectedColumn(e.target.value)}
              >
                {data.columnOrder.map(columnId => (
                  <option key={columnId} value={columnId}>
                    {data.columns[columnId].title}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="primary" type="submit">
                Create
              </Button>
              <Button 
                variant="danger" 
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <DragDropContext onDragEnd={onDragEnd}>
        <Row>
          {data.columnOrder.map((columnId) => {
            const column = data.columns[columnId];
            const tasks = column.taskIds.map(taskId => data.tasks[taskId]);

            return (
              <Col key={column.id} md={STYLES.COL_MD} className="mb-4">
                <Card>
                  <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{column.title}</h5>
                    <Badge bg="light" text="dark">{tasks.length}</Badge>
                  </Card.Header>
                  <Droppable droppableId={column.id}>
                    {(provided) => (
                      <Card.Body
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{ minHeight: STYLES.CARD_MIN_HEIGHT }}
                      >
                        {tasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided) => (
                              <Card
                                className="mb-2"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Card.Body>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                      <Card.Title>{task.title}</Card.Title>
                                      <Card.Text>{task.content}</Card.Text>
                                    </div>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleDeleteTask(task.id, column.id)}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </Card.Body>
                              </Card>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Card.Body>
                    )}
                  </Droppable>
                </Card>
              </Col>
            );
          })}
        </Row>
      </DragDropContext>
    </Container>
  );
}