import React, { useState, useEffect } from "react";
import { Form, Button, Modal, InputGroup } from "react-bootstrap";
import dayjs from "dayjs";
import { Icon } from "@iconify/react";
import { API_BASE_URL } from "./../config";
import axios from "axios"; // Certifique-se de que o axios está configurado.

const Turmas = ({ turmas, onSelectTurma }) => {
  const [selectedTurma, setSelectedTurma] = useState(null);
  const [cursoNome, setCursoNome] = useState("");
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Buscar o nome do curso pelo ID do curso
  const fetchCursoNome = async (cursoId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cursos/${cursoId}`);
      setCursoNome(response.data.cp_nome_curso || "Não disponível");
    } catch (error) {
      console.error("Erro ao buscar o nome do curso:", error);
      setCursoNome("Não disponível");
    }
  };

  const handleSelectChange = async (turmaId) => {
    const turma = turmas.find((t) => t.cp_tr_id === parseInt(turmaId));
    setSelectedTurma(turma || null);
    onSelectTurma(turmaId);

    if (turma && turma.cp_tr_curso_id) {
      await fetchCursoNome(turma.cp_tr_curso_id); // Buscar o nome do curso
    }
  };

  const handleShowInfo = () => {
    if (selectedTurma) {
      setShowInfoModal(true);
    }
  };

  const handleCloseInfo = () => {
    setShowInfoModal(false);
  };

  return (
    <>
      <p>Selecione sua turma</p>
      <InputGroup>
        <Form.Control
          as="select"
           defaultValue=""
          onChange={(e) => handleSelectChange(e.target.value)}
        >
          <option value="" disabled>
            {turmas.length > 0 ? "Selecione..." : "Nenhuma turma disponível"}
          </option>
          {turmas.map((turma) => (
            <option key={turma.cp_tr_id} value={turma.cp_tr_id}>
              {turma.cp_tr_nome}
            </option>
          ))}
        </Form.Control>
        <Button
          variant="outline-secondary"
          className="d-flex align-items-center"
          onClick={handleShowInfo}
          disabled={!selectedTurma}
          title="Ver informações da turma selecionada"
        >
          <Icon icon="mdi:information-outline" width="20" />
        </Button>
      </InputGroup>

      {/* Modal para mostrar informações da turma */}
      {selectedTurma && (
        <Modal show={showInfoModal} onHide={handleCloseInfo} centered>
          <Modal.Header closeButton>
            <Modal.Title>Informações da Turma</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>
              <strong>Nome:</strong> {selectedTurma.cp_tr_nome}
            </p>
            <p>
              <strong>Data:</strong>{" "}
              {dayjs(selectedTurma.cp_tr_data).format("DD/MM/YYYY")}
            </p>
            <p>
              <strong>Professor:</strong> {selectedTurma.nomeDoProfessor}
            </p>
            <p>
              <strong>Escola:</strong> {selectedTurma.nomeDaEscola}
            </p>
            <p>
              <strong>Curso:</strong> {cursoNome}
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseInfo}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  );
};

export default Turmas;
