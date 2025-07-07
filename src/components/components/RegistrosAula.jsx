// Componente RegistrosAula com funcionalidade de edição com Modal e separação de links
import React, { useState, useEffect } from "react";
import { Form, Table, Button, Modal } from "react-bootstrap";
import axios from "axios";
import { API_BASE_URL } from "../config";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { Icon } from "@iconify/react";

const RegistrosAula = ({ turmaId, onAtualizar, atualizarResumos }) => {
    console.log("Etapa 3: atualizarResumos recebido no RegistrosAula:", atualizarResumos);
    const [resumosPorData, setResumosPorData] = useState({});
    const [dataSelecionada, setDataSelecionada] = useState("");
    const [resumosSelecionados, setResumosSelecionados] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [resumoAtual, setResumoAtual] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [resumoParaExcluir, setResumoParaExcluir] = useState(null);


    const [formData, setFormData] = useState({
        resumo: "",
        aula: "",
        link: "",
        linkYoutube: "",
    });

    const handleAbrirModalExcluir = (resumo) => {
        setResumoParaExcluir(resumo);
        setShowDeleteModal(true);
    };

    useEffect(() => {
        if (turmaId) {
            fetchResumos();
        } else {
            setResumosPorData({});
            setDataSelecionada("");
            setResumosSelecionados([]);
        }
    }, [turmaId]);


    useEffect(() => {
        if (atualizarResumos) {
            console.log("Sinal recebido no RegistrosAula. Chamando fetchResumos.");
            fetchResumos();
        }
    }, [atualizarResumos]);

    useEffect(() => {
        if (dataSelecionada) {
            setResumosSelecionados(resumosPorData[dataSelecionada] || []);
        } else {
            setResumosSelecionados([]);
        }
    }, [dataSelecionada, resumosPorData]);


    const fetchResumos = async () => {
        try {
            console.log("Etapa 5: fetchResumos chamado no RegistrosAula.");
            const response = await axios.get(`${API_BASE_URL}/resumos/${turmaId}`);
            console.log("Dados retornados do fetchResumos:", response.data); // Adicione isso
            const resumos = response.data;

            // Agrupar resumos por data
            const agrupados = resumos.reduce((acc, resumo) => {
                const data = resumo.cp_res_data;
                if (!acc[data]) acc[data] = [];
                acc[data].push(resumo);
                return acc;
            }, {});

            setResumosPorData(agrupados);
        } catch (error) {
            console.error("Erro ao buscar registros:", error);
            toast.error("Erro ao buscar registros. Tente novamente mais tarde.");
        }
    };


    const handleSelecionarData = (data) => {
        setDataSelecionada(data);
        setResumosSelecionados(resumosPorData[data] || []);
    };

    const handleAbrirModalEdicao = (resumo) => {
        setResumoAtual(resumo);
        setFormData({
            resumo: resumo.cp_res_resumo,
            aula: resumo.cp_res_aula,
            link: resumo.cp_res_link,
            linkYoutube: resumo.cp_res_link_youtube,
        });
        setShowModal(true);
    };

    const handleFecharModal = () => {
        setShowModal(false);
        setResumoAtual(null);
        setFormData({ resumo: "", aula: "", link: "", linkYoutube: "" });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSalvarEdicao = async () => {
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("resumo", formData.resumo);
            formDataToSend.append("aula", formData.aula);
            formDataToSend.append("link", formData.link);
            formDataToSend.append("linkYoutube", formData.linkYoutube);

            if (formData.arquivo) {
                formDataToSend.append("arquivo", formData.arquivo);
            }

            const response = await axios.put(
                `${API_BASE_URL}/resumos/${resumoAtual.cp_res_id}`,
                formDataToSend,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            const resumoAtualizado = response.data;

            setResumosPorData((prev) => {
                const data = resumoAtual.cp_res_data;
                const resumosAtualizados = prev[data].map((resumo) =>
                    resumo.cp_res_id === resumoAtualizado.cp_res_id
                        ? resumoAtualizado
                        : resumo
                );
                return { ...prev, [data]: resumosAtualizados };
            });

            setResumosSelecionados((prev) =>
                prev.map((resumo) =>
                    resumo.cp_res_id === resumoAtualizado.cp_res_id
                        ? resumoAtualizado
                        : resumo
                )
            );

            toast.success("Resumo editado com sucesso.");
            handleFecharModal();
            console.log("Etapa 3: Dados sendo enviados para o RegistrosAula:", resumosPorData);
            // Atualiza os resumos localmente e notifica o pai
            fetchResumos(); // Atualização local
            if (onAtualizar) onAtualizar(); // Notifica o pai
        } catch (error) {
            console.error("Erro ao editar resumo:", error);
            toast.error("Erro ao editar resumo. Tente novamente mais tarde.");
        }
    };

    const handleExcluirResumo = async () => {
        if (!resumoParaExcluir) return;
        try {
            await axios.delete(`${API_BASE_URL}/resumos/${resumoParaExcluir.cp_res_id}`);
            toast.success("Resumo excluído com sucesso.");
            fetchResumos();
        } catch (error) {
            console.error("Erro ao excluir resumo:", error);
            toast.error("Erro ao excluir resumo. Tente novamente mais tarde.");
        } finally {
            setShowDeleteModal(false);
            setResumoParaExcluir(null);
        }
    };


    return (
        <div>
            {/* Dropdown para selecionar a data */}
            <h5 className="mb-3">Registro de Resumos</h5>
            <Form.Select
                onChange={(e) => handleSelecionarData(e.target.value)}
                className="mb-3"
            >
                <option value="">Selecione uma data</option>
                {Object.keys(resumosPorData).map((data) => (
                    <option key={data} value={data}>
                        {dayjs(data).format("DD/MM/YYYY")}
                    </option>
                ))}
            </Form.Select>

            {/* Tabela para exibir resumos */}
            <div className="table-responsive scroll-sm">
                <Table className="table bordered-table sm-table mb-0">
                    <thead>
                        <tr>
                            <th>Aula</th>
                            <th>Resumo</th>
                            <th>Link</th>
                            <th>Vídeo</th>
                            <th>Material</th>
                            <th className="text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resumosSelecionados.length > 0 ? (
                            resumosSelecionados.map((resumo) => (
                                <tr key={resumo.cp_res_id}>
                                    <td>{resumo.cp_res_aula || "Não informado"}</td>
                                    <td>{resumo.cp_res_resumo}</td>
                                    <td>
                                        {resumo.cp_res_link && (
                                            <a
                                                href={
                                                    resumo.cp_res_link.startsWith("http")
                                                        ? resumo.cp_res_link
                                                        : `http://${resumo.cp_res_link}`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Link
                                            </a>
                                        )}
                                    </td>
                                    <td>
                                        {resumo.cp_res_link_youtube && (
                                            <a
                                                href={
                                                    resumo.cp_res_link_youtube.startsWith("http")
                                                        ? resumo.cp_res_link_youtube
                                                        : `http://${resumo.cp_res_link_youtube}`
                                                }
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Vídeo
                                            </a>
                                        )}
                                    </td>
                                    <td>
                                        {resumo.cp_res_arquivo && (
                                            <a
                                                href={resumo.cp_res_arquivo}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                Material
                                            </a>
                                        )}
                                    </td>
                                    <td className="text-center d-flex gap-2 justify-content-center">
                                        <Button
                                            variant="link"
                                            onClick={() => handleAbrirModalEdicao(resumo)}
                                            title="Editar"
                                            className="p-0 text-primary"
                                        >
                                            <Icon icon="mdi:pencil" />
                                        </Button>
                                        <Button
                                            variant="link"
                                            onClick={() => handleAbrirModalExcluir(resumo)}
                                            title="Excluir"
                                            className="p-0 text-danger"
                                        >
                                            <Icon icon="mdi:trash-can-outline" />
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center">
                                    Nenhum registro encontrado.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </div>


            {/* Modal para editar resumo */}
            <Modal show={showModal} onHide={handleFecharModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Resumo</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Resumo</Form.Label>
                            <Form.Control
                                type="text"
                                name="resumo"
                                value={formData.resumo}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Aula</Form.Label>
                            <Form.Control
                                type="text"
                                name="aula"
                                value={formData.aula}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Link</Form.Label>
                            <Form.Control
                                type="text"
                                name="link"
                                value={formData.link}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Link do YouTube</Form.Label>
                            <Form.Control
                                type="text"
                                name="linkYoutube"
                                value={formData.linkYoutube}
                                onChange={handleInputChange}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Material</Form.Label>
                            <Form.Control
                                type="file"
                                name="arquivo"
                                onChange={(e) => setFormData({ ...formData, arquivo: e.target.files[0] })}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleFecharModal}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSalvarEdicao}>
                        Salvar
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Exclusão</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Tem certeza que deseja excluir o resumo "{resumoParaExcluir?.cp_res_resumo}"?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={handleExcluirResumo}>
                        Excluir
                    </Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default RegistrosAula;
