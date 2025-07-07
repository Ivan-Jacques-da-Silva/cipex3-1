import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Table, Badge, Button, Modal, Form, Card } from "react-bootstrap";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import axios from "axios";
import { API_BASE_URL } from "./../config";
import CadastrarResumoChamada from "./CadastroResumo.jsx";
import RegistrosAula from './RegistrosAula.jsx'

const getBadgeVariant = (status) => {
  switch (status) {
    case "Presente":
      return "success";
    case "Ausente":
      return "danger";
    case "Justificado":
      return "warning";
    default:
      return "secondary";
  }
};

const HistoricoChamadas = ({ turmaId, historico, onUpdateStatus, alunos, atualizarHistorico }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [resumosPorData, setResumosPorData] = useState({});
  const [itemsPerPage] = useState(10);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState(null);
  const [showResumoForm, setShowResumoForm] = useState(false);
  const [selectedChamadaId, setSelectedChamadaId] = useState(null);
  const [selectedChamadaDate, setSelectedChamadaDate] = useState(null);
  const [atualizarResumos, setAtualizarResumos] = useState(false);
  const [formData, setFormData] = useState({
    alunoId: "",
    data: dayjs().format("YYYY-MM-DD"),
    hora: dayjs().format("HH:mm"),
    status: "Presente",
  });
  const isMobile = window.innerWidth <= 768;

  const confirmStatusUpdate = (chamadaId, status) => {
    setPendingStatusUpdate({ chamadaId, status });
    setShowConfirmModal(true);
  };


  const handleAtualizarResumos = () => {
    setAtualizarResumos((prev) => !prev);
  };

  const handleDeleteChamada = async (chamadaId) => {
    try {
      await axios.delete(`${API_BASE_URL}/chamadas/${chamadaId}`);
      toast.success("Chamada deletada com sucesso.");
      // Atualizar a lista de chamadas localmente
      atualizarHistorico();
    } catch (error) {
      console.error("Erro ao deletar chamada:", error);
      toast.error("Erro ao deletar chamada. Tente novamente mais tarde.");
    }
  };

  const handleOpenResumoForm = (chamadaId) => {
    const chamadaSelecionada = historico.find((chamada) => chamada.cp_ch_id === chamadaId);
    if (chamadaSelecionada) {
      setSelectedChamadaId(chamadaId);
      setSelectedChamadaDate(chamadaSelecionada.cp_ch_data);
    }
    setShowResumoForm(true);
  };

  const handleConfirmStatusUpdate = () => {
    if (pendingStatusUpdate) {
      onUpdateStatus(pendingStatusUpdate.chamadaId, pendingStatusUpdate.status);
      setPendingStatusUpdate(null);
      setShowConfirmModal(false);
    } else {
      toast.error("Erro ao confirmar a atualização do status.");
    }
  };

  const totalPaginas = Math.ceil(historico.length / itemsPerPage);
  const currentItems = historico.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const paginasVisiveis = [];
  for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPaginas, currentPage + 2); i++) {
    paginasVisiveis.push(i);
  }

  // useEffect(() => {
  //   if (!turmaId) {
  //     console.error("turmaId está indefinido");
  //     return;
  //   }
  //   axios
  //     .get(`${API_BASE_URL}/turmas/${turmaId}/alunos`)
  //     .then((response) => {
  //       setUsuariosDisponiveis(response.data);
  //       if (response.data.length === 1) {
  //         setFormData((prev) => ({
  //           ...prev,
  //           alunoId: response.data[0].cp_id,
  //         }));
  //       }
  //     })
  //     .catch((error) => {
  //       console.error("Erro ao buscar alunos:", error);
  //       toast.error("Erro ao buscar alunos. Tente novamente.");
  //     });
  // }, [turmaId]);


  useEffect(() => {
    // if (turmaId) {
    //   atualizarResumos();
    //   atualizarHistorico();
    // }
    setCurrentPage(1);
  }, [turmaId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (alunos.length === 1 && formData.alunoId !== alunos[0].cp_id) {
      setFormData((prev) => ({ ...prev, alunoId: alunos[0].cp_id }));
    }
  }, [alunos, formData.alunoId]);


  const handleCadastrarChamada = async () => {
    const { alunoId, data, hora, status } = formData;
    if (!alunoId || !data || !hora || !status || !turmaId) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/chamadas`, { turmaId, alunoId, data, hora, status });
      toast.success("Chamada cadastrada com sucesso!");
      setFormData({ alunoId: "", data: dayjs().format("YYYY-MM-DD"), hora: dayjs().format("HH:mm"), status: "Presente" });
      atualizarHistorico();
    } catch (error) {
      console.error("Erro ao cadastrar chamada:", error);
      toast.error("Erro ao cadastrar chamada. Tente novamente.");
    }
  };

  // const atualizarResumos = async () => {
  //   try {
  //     const response = await axios.get(`${API_BASE_URL}/resumos/${turmaId}`);
  //     const resumos = response.data;

  //     const agrupados = resumos.reduce((acc, resumo) => {
  //       const data = resumo.cp_res_data;
  //       if (!acc[data]) acc[data] = [];
  //       acc[data].push(resumo);
  //       return acc;
  //     }, {});

  //     console.log("Etapa 2: Atualizando resumosPorData no pai:", agrupados);
  //     setResumosPorData(agrupados);
  //   } catch (error) {
  //     console.error("Erro ao atualizar resumos no pai:", error);
  //     toast.error("Erro ao atualizar resumos. Tente novamente.");
  //   }
  // };



  return (
    <div>

      <div className="mb-3 p-3 border rounded">
        <h5>Cadastrar Nova Chamada</h5>
        <Form className="row g-3">
          <Form.Group controlId="alunoId" className="col-md-3">
            <Form.Label>Aluno</Form.Label>
            {alunos.length === 1 ? (
              <Form.Control
                type="text"
                value={alunos[0].cp_nome}
                readOnly
                onFocus={() =>
                  setFormData((prev) => ({ ...prev, alunoId: alunos[0].cp_id }))
                }
              />
            ) : (
              <Form.Select
                name="alunoId"
                value={formData.alunoId}
                onChange={handleInputChange}
              >
                <option value="">Selecione um aluno</option>
                {alunos.map((aluno) => (
                  <option key={aluno.cp_id} value={aluno.cp_id}>
                    {aluno.cp_nome}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>
          <Form.Group controlId="data" className="col-md-3">
            <Form.Label>Data</Form.Label>
            <Form.Control
              type="date"
              name="data"
              value={formData.data}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group controlId="hora" className="col-md-3">
            <Form.Label>Hora</Form.Label>
            <Form.Control
              type="time"
              name="hora"
              value={formData.hora}
              onChange={handleInputChange}
            />
          </Form.Group>
          <Form.Group controlId="status" className="col-md-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
            >
              <option value="Presente">Presente</option>
              <option value="Ausente">Ausente</option>
              <option value="Justificado">Justificado</option>
            </Form.Select>
          </Form.Group>
          <div className="col-12 text-end">
            <Button variant="primary" onClick={handleCadastrarChamada}>
              Cadastrar
            </Button>
          </div>
        </Form>
      </div>

      <div className={`d-flex`}>
        {/* Tabela */}
        {/* <div className={`table-container ${showResumoForm ? "col-8" : "col-12"}`}> */}
        <div className={`table-container ${isMobile || !showResumoForm ? "col-12" : "col-8"}`}>
          <div className="table-responsive scroll-sm">
            <Table className="table bordered-table sm-table mb-0">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Data</th>
                  <th>Hora</th>
                  <th>Status</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((chamada) => (
                    <tr key={chamada.cp_ch_id}>
                      <td>{chamada.cp_nome_aluno}</td>
                      <td>{dayjs(chamada.cp_ch_data).format("DD/MM/YYYY")}</td>
                      <td>{chamada.cp_ch_hora}</td>
                      <td>
                        <Badge bg={getBadgeVariant(chamada.cp_ch_status)}>
                          {chamada.cp_ch_status}
                        </Badge>
                      </td>
                      <td className="text-center d-flex gap-2 justify-content-center">
                        <Button
                          variant="link"
                          className="bg-success text-white rounded-circle"
                          onClick={() => confirmStatusUpdate(chamada.cp_ch_id, "Presente")}
                          title="Marcar como Presente"
                        >
                          {/* <Icon icon="mdi:check-circle" /> */}
                          P
                        </Button>
                        <Button
                          variant="link"
                          className="bg-warning text-dark rounded-circle"
                          onClick={() => confirmStatusUpdate(chamada.cp_ch_id, "Justificado")}
                          title="Marcar como Justificado"
                        >
                          {/* <Icon icon="mdi:account-alert" /> */}
                          J
                        </Button>
                        <Button
                          variant="link"
                          className="bg-danger-hover text-white rounded-circle"
                          onClick={() => confirmStatusUpdate(chamada.cp_ch_id, "Ausente")}
                          title="Marcar como Ausente"
                        >
                          {/* <Icon icon="mdi:cancel" /> */}
                          F
                        </Button>
                        <Button
                          variant="link"
                          className="bg-primary text-white rounded-circle"
                          onClick={() => handleOpenResumoForm(chamada.cp_ch_id)}
                          title="Cadastrar Resumo"
                        >
                          <Icon icon="mdi:note-plus" />
                        </Button>
                        <Button
                          variant="link"
                          className="bg-danger-focus text-neutral-700 border-neutral-700 rounded-circle"
                          onClick={() => handleDeleteChamada(chamada.cp_ch_id)}
                          title="Excluir Chamada"
                        >
                          <Icon icon="mingcute:delete-2-line" />
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center">
                      Nenhuma chamada encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
          <div className="d-flex align-items-center justify-content-between mt-24">
            <span>
              Mostrando {currentPage} de {totalPaginas} páginas
            </span>
            <ul className="pagination d-flex flex-wrap align-items-center gap-2 justify-content-center">
              <li className="page-item">
                <button
                  className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <Icon icon="ep:d-arrow-left" />
                </button>
              </li>
              <li className="page-item">
                <button
                  className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </button>
              </li>
              {paginasVisiveis.map((page) => (
                <li key={page} className={`page-item ${currentPage === page ? "active" : ""}`}>
                  <button
                    className={`page-link text-md fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px ${currentPage === page ? "bg-primary-600 text-white" : "bg-neutral-200 text-secondary-light"}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                </li>
              ))}
              {totalPaginas > 5 && currentPage + 2 < totalPaginas && (
                <li className="page-item">
                  <span className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px w-32-px">
                    ...
                  </span>
                </li>
              )}
              <li className="page-item">
                <button
                  className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPaginas))}
                  disabled={currentPage === totalPaginas}
                >
                  Próximo
                </button>
              </li>
              <li className="page-item">
                <button
                  className="page-link bg-neutral-200 text-secondary-light fw-semibold radius-8 border-0 d-flex align-items-center justify-content-center h-32-px text-md"
                  onClick={() => setCurrentPage(totalPaginas)}
                  disabled={currentPage === totalPaginas}
                >
                  <Icon icon="ep:d-arrow-right" />
                </button>
              </li>
            </ul>
          </div>
        </div>

        {showResumoForm && (
          <CadastrarResumoChamada
            chamadaId={selectedChamadaId}
            turmaId={turmaId}
            setShowResumoForm={setShowResumoForm}
            // atualizarResumos={atualizarResumos}
            atualizarResumos={handleAtualizarResumos}
            dataChamada={selectedChamadaDate}
          />
        )}

      </div>
      <div className="my-5">
        <div className="row justify-content-center">
          <div className="col-12">
            {/* <Card className="shadow-sm">
              <Card.Body> */}
            <RegistrosAula
              turmaId={turmaId}
              chamadaId={selectedChamadaId}
              onAtualizar={atualizarHistorico}
              atualizarResumos={atualizarResumos}
            />
            {/* </Card.Body>
            </Card> */}
          </div>
        </div>
      </div>


      {/* Modal de confirmação status */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmação</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Você tem certeza que deseja alterar o status para <strong>{pendingStatusUpdate?.status}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleConfirmStatusUpdate}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>

  );
};

export default HistoricoChamadas;
