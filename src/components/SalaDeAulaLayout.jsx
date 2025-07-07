// SalaDeAula.js
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Turmas from "./components/Turmas.jsx";
import HistoricoChamadas from "./components/HistoricoChamadas.jsx";
// import ResumoMaterial from "./components/ResumoMaterial.jsx";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./config";

const SalaDeAula = () => {
    const [turmas, setTurmas] = useState([]);
    const [selectedTurma, setSelectedTurma] = useState(null);
    const [alunos, setAlunos] = useState([]);
    const [historicoChamadas, setHistoricoChamadas] = useState([]);
    const [showResumoCard, setShowResumoCard] = useState(false);
    const [selectedChamadaId, setSelectedChamadaId] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const userType = localStorage.getItem("userType");
        if (userType === "5") {
            navigate("/sala-de-aula-aluno");
        }
    }, [navigate]);


    const carregarTurmas = async () => {
        try {
            const schoolId = localStorage.getItem("schoolId");
            const userId = localStorage.getItem("userId");
            const response = await axios.get(`${API_BASE_URL}/turmasComAlunos`);
            const filteredTurmas = response.data.filter(
                (turma) =>
                    turma.cp_tr_id_escola === parseInt(schoolId) &&
                    turma.cp_tr_id_professor === parseInt(userId)
            );
            setTurmas(filteredTurmas);
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
            toast.error("Erro ao carregar turmas. Tente novamente mais tarde.");
        }
    };

    const carregarDadosTurma = async (turmaId) => {
        try {
            const alunosResponse = await axios.get(`${API_BASE_URL}/turmas/${turmaId}/alunos`);
            setAlunos(alunosResponse.data);

            const chamadasResponse = await axios.get(`${API_BASE_URL}/chamadas/turma/${turmaId}`);
            setHistoricoChamadas(chamadasResponse.data);
        } catch (error) {
            console.error("Erro ao carregar dados da turma:", error);
            toast.error("Erro ao carregar dados da turma. Tente novamente mais tarde.");
        }
    };

    const atualizarHistorico = async () => {
        try {
            const chamadasResponse = await axios.get(`${API_BASE_URL}/chamadas/turma/${selectedTurma}`);
            setHistoricoChamadas(chamadasResponse.data);
        } catch (error) {
            console.error("Erro ao atualizar histórico de chamadas:", error);
            toast.error("Erro ao atualizar o histórico. Tente novamente mais tarde.");
        }
    };

    const handleSelectTurma = (turmaId) => {
        setSelectedTurma(turmaId);
        setSelectedChamadaId(null);
        setHistoricoChamadas([]);
        carregarDadosTurma(turmaId);
    };

    const handleUpdateStatus = async (chamadaId, status) => {
        try {
            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().split('T')[0];
            const formattedTime = currentDate.toTimeString().split(' ')[0];

            await axios.put(`${API_BASE_URL}/chamadas/${chamadaId}`, {
                data: formattedDate,
                hora: formattedTime,
                status,
            });

            toast.success(`Status atualizado para: ${status}`);
            await atualizarHistorico();
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Erro ao atualizar status. Tente novamente.");
        }
    };

    const handleOpenResumo = (chamadaId) => {
        setSelectedChamadaId(chamadaId);
        setShowResumoCard(true);
    };

    const handleCloseResumo = () => {
        setShowResumoCard(false);
        setSelectedChamadaId(null);
    };

    useEffect(() => {
        carregarTurmas();
    }, []);

    return (
        <Container fluid>
            <ToastContainer />
            <Row className="justify-content-center my-4">
                <Col xs={12} md={12}>
                    <Card>
                        <Card.Body>
                            {/* <h5 className="mb-4">Sala de Aula</h5> */}
                            <Turmas turmas={turmas} onSelectTurma={handleSelectTurma} />

                            {selectedTurma && (
                                <HistoricoChamadas
                                    turmaId={selectedTurma}
                                    historico={historicoChamadas}
                                    alunos={alunos}
                                    onUpdateStatus={handleUpdateStatus}
                                    atualizarHistorico={atualizarHistorico}
                                    onOpenResumo={handleOpenResumo}
                                />
                            )}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SalaDeAula;
