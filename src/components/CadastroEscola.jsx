import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Row, Col, Button, Form, Modal } from "react-bootstrap";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import InputMask from "react-input-mask";

const CadastroEscolaModal = ({ escolaId }) => {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [usuariosResponsaveis, setUsuariosResponsaveis] = useState([]);
    const formatarDataAtual = () => {
        const data = new Date();
        data.setMinutes(data.getMinutes() - data.getTimezoneOffset());
        return data.toISOString().slice(0, 10);
    };

    const [escolaData, setEscolaData] = useState({
        cp_ec_nome: "",
        cp_ec_responsavel: "",
        cp_ec_endereco_rua: "",
        cp_ec_endereco_numero: "",
        cp_ec_endereco_cidade: "",
        cp_ec_endereco_bairro: "",
        cp_ec_endereco_estado: "",
        cp_ec_data_cadastro: formatarDataAtual(),
        cp_ec_descricao: "",
    });

    useEffect(() => {
        fetchResponsaveis();
    }, []);

    useEffect(() => {
        if (escolaId && usuariosResponsaveis.length > 0) {
            const token = localStorage.getItem('token');
            axios
                .get(`${API_BASE_URL}/escolas/${escolaId}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                })
                .then((response) => {
                    const escola = response.data;
                    console.log("Dados da escola carregados:", escola);

                    // Verificar se o responsável da escola existe na lista de responsáveis
                    const responsavelEncontrado = usuariosResponsaveis.find(
                        usuario => usuario.cp_nome === escola.cp_ec_responsavel
                    );

                    setEscolaData({
                        ...escola,
                        cp_ec_data_cadastro: escola.cp_ec_data_cadastro
                            ? escola.cp_ec_data_cadastro.slice(0, 10)
                            : formatarDataAtual(),
                        // Se não encontrar o responsável, definir como "Diretor"
                        cp_ec_responsavel: responsavelEncontrado 
                            ? escola.cp_ec_responsavel 
                            : "Diretor"
                    });
                })
                .catch((error) => {
                    console.error("Erro ao buscar escola:", error);
                    toast.error("Erro ao carregar os dados da escola.");
                });
        }
    }, [escolaId, usuariosResponsaveis]);

    const fetchResponsaveis = async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/users-escolas?cp_tipo_user=2`,
            );
            if (response.data && response.data.length > 0) {
                setUsuariosResponsaveis(response.data);
            }
        } catch (error) {
            console.error("Erro ao buscar os responsáveis:", error);
            toast.error("Erro ao buscar os responsáveis");
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEscolaData((prevEscolaData) => ({
            ...prevEscolaData,
            [name]: value,
        }));
    };

    const estados = [
        "AC",
        "AL",
        "AP",
        "AM",
        "BA",
        "CE",
        "DF",
        "ES",
        "GO",
        "MA",
        "MT",
        "MS",
        "MG",
        "PA",
        "PB",
        "PR",
        "PE",
        "PI",
        "RJ",
        "RN",
        "RS",
        "RO",
        "RR",
        "SC",
        "SP",
        "SE",
        "TO",
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setShowModal(false);
        if (loading) return;

        // Validação dos campos obrigatórios
        if (!escolaData.cp_ec_nome) {
            toast.error("Nome da escola é obrigatório!");
            return;
        }
        if (!escolaData.cp_ec_endereco_cidade) {
            toast.error("Cidade é obrigatória!");
            return;
        }
        if (!escolaData.cp_ec_endereco_bairro) {
            toast.error("Bairro é obrigatório!");
            return;
        }
        if (!escolaData.cp_ec_endereco_estado) {
            toast.error("Estado é obrigatório!");
            return;
        }
        if (!escolaData.cp_ec_endereco_rua) {
            toast.error("Rua é obrigatória!");
            return;
        }
        if (!escolaData.cp_ec_endereco_numero) {
            toast.error("Número é obrigatório!");
            return;
        }
        if (!escolaData.cp_ec_responsavel) {
            toast.error("Responsável é obrigatório!");
            return;
        }

        setLoading(true);

        try {
            const modoEdicao = Boolean(escolaId);
            const token = localStorage.getItem('token');

            const dadosEscola = {
                cp_ec_nome: escolaData.cp_ec_nome,
                cp_ec_responsavel: escolaData.cp_ec_responsavel,
                cp_ec_endereco_rua: escolaData.cp_ec_endereco_rua,
                cp_ec_endereco_numero: escolaData.cp_ec_endereco_numero,
                cp_ec_endereco_cidade: escolaData.cp_ec_endereco_cidade,
                cp_ec_endereco_bairro: escolaData.cp_ec_endereco_bairro,
                cp_ec_endereco_estado: escolaData.cp_ec_endereco_estado,
                cp_ec_data_cadastro: escolaData.cp_ec_data_cadastro || new Date().toISOString().slice(0, 10),
                cp_ec_descricao: escolaData.cp_ec_descricao,
            };

            const resposta = modoEdicao
                ? await axios.put(
                      `${API_BASE_URL}/escolas/${escolaId}`,
                      dadosEscola,
                      {
                          headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`,
                          },
                      },
                  )
                : await axios.post(
                      `${API_BASE_URL}/escolas`,
                      dadosEscola,
                      {
                          headers: {
                              "Content-Type": "application/json",
                              "Authorization": `Bearer ${token}`,
                          },
                      },
                  );

            if (resposta.status === 200 && resposta.data.success) {
                toast.success(
                    modoEdicao
                        ? "Escola atualizada com sucesso!"
                        : "Escola cadastrada com sucesso!",
                );

                // Limpar formulário apenas se for cadastro novo
                if (!modoEdicao) {
                    setEscolaData({
                        cp_ec_nome: "",
                        cp_ec_responsavel: "",
                        cp_ec_endereco_rua: "",
                        cp_ec_endereco_numero: "",
                        cp_ec_endereco_cidade: "",
                        cp_ec_endereco_bairro: "",
                        cp_ec_endereco_estado: "",
                        cp_ec_data_cadastro: "",
                        cp_ec_descricao: "",
                    });
                }
            } else {
                throw new Error(resposta.data?.message || "Erro inesperado");
            }
        } catch (error) {
            console.error("Erro:", error);
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.message || 
                               "Erro ao realizar a operação. Tente novamente.";
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <ToastContainer />

            <form className="form-container-cad" onSubmit={handleSubmit}>
                <Row>
                    <Col md={6}>
                        {/* Coluna da Esquerda */}
                        <div className="card mb-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">
                                    Informações da Escola
                                </h6>
                            </div>
                            <div className="card-body">
                                <Row className="gy-3">
                                    <Col md={12}>
                                        <label htmlFor="cp_ec_nome">
                                            Nome
                                            <span className="required">*</span>:
                                        </label>
                                        <input
                                            type="text"
                                            id="cp_ec_nome"
                                            name="cp_ec_nome"
                                            value={escolaData.cp_ec_nome}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Nome"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_ec_data_cadastro">
                                            Data de Cadastro
                                            <span className="required">*</span>:
                                        </label>
                                        <input
                                            type="date"
                                            id="cp_ec_data_cadastro"
                                            name="cp_ec_data_cadastro"
                                            value={
                                                escolaData.cp_ec_data_cadastro
                                            }
                                            onChange={handleChange}
                                            className="form-control"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_ec_responsavel">
                                            Responsável
                                            <span className="required">*</span>:
                                        </label>
                                        <select
                                            id="cp_ec_responsavel"
                                            name="cp_ec_responsavel"
                                            value={escolaData.cp_ec_responsavel}
                                            onChange={handleChange}
                                            className="form-control"
                                            required
                                        >
                                            <option value="">
                                                Selecione o responsável
                                            </option>
                                            <option value="Diretor">
                                                Diretor
                                            </option>
                                            {usuariosResponsaveis.map(
                                                (usuario) => (
                                                    <option
                                                        key={
                                                            usuario.id ||
                                                            usuario.cp_nome
                                                        }
                                                        value={usuario.cp_nome}
                                                    >
                                                        {usuario.cp_nome}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                    </Col>
                                </Row>
                            </div>
                        </div>
                        <div className="card mb-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">
                                    Detalhes Adicionais
                                </h6>
                            </div>
                            <div className="card-body">
                                <Row className="gy-3">
                                    <Col md={12}>
                                        <label htmlFor="cp_ec_descricao">
                                            Descrição:
                                        </label>
                                        <textarea
                                            id="cp_ec_descricao"
                                            name="cp_ec_descricao"
                                            value={escolaData.cp_ec_descricao}
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Descrição da Escola"
                                        />
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </Col>

                    <Col md={6}>
                        <div className="card mt-4 mb-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Endereço</h6>
                            </div>
                            <div className="card-body">
                                <Row className="gy-3">
                                    <Col md={12}>
                                        <label htmlFor="cp_ec_endereco_cidade">
                                            Cidade
                                            <span className="required">*</span>:
                                        </label>
                                        <input
                                            type="text"
                                            id="cp_ec_endereco_cidade"
                                            name="cp_ec_endereco_cidade"
                                            value={
                                                escolaData.cp_ec_endereco_cidade
                                            }
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Cidade"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_ec_endereco_bairro">
                                            Bairro
                                            <span className="required">*</span>:
                                        </label>
                                        <input
                                            type="text"
                                            id="cp_ec_endereco_bairro"
                                            name="cp_ec_endereco_bairro"
                                            value={
                                                escolaData.cp_ec_endereco_bairro
                                            }
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Bairro"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_ec_endereco_estado">
                                            Estado
                                            <span className="required">*</span>:
                                        </label>
                                        <select
                                            id="cp_ec_endereco_estado"
                                            name="cp_ec_endereco_estado"
                                            value={
                                                escolaData.cp_ec_endereco_estado
                                            }
                                            onChange={handleChange}
                                            className="form-control"
                                            required
                                        >
                                            <option value="">
                                                Selecione o estado
                                            </option>
                                            {estados.map((estado, index) => (
                                                <option
                                                    key={index}
                                                    value={estado}
                                                >
                                                    {estado}
                                                </option>
                                            ))}
                                        </select>
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_ec_endereco_rua">
                                            Rua
                                            <span className="required">*</span>:
                                        </label>
                                        <input
                                            type="text"
                                            id="cp_ec_endereco_rua"
                                            name="cp_ec_endereco_rua"
                                            value={
                                                escolaData.cp_ec_endereco_rua
                                            }
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Rua"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="cp_ec_endereco_numero">
                                            Número
                                            <span className="required">*</span>:
                                        </label>
                                        <input
                                            type="text"
                                            id="cp_ec_endereco_numero"
                                            name="cp_ec_endereco_numero"
                                            value={
                                                escolaData.cp_ec_endereco_numero
                                            }
                                            onChange={handleChange}
                                            className="form-control"
                                            placeholder="Número"
                                            required
                                        />
                                    </Col>
                                </Row>
                            </div>
                        </div>
                    </Col>
                </Row>

                <div className="mt-4 text-center">
                    <button
                        type="button"
                        className="btn btn-primary"
                        disabled={loading}
                        onClick={() => setShowModal(true)}
                    >
                        {loading
                            ? "Salvando..."
                            : escolaId
                              ? "Salvar Alterações"
                              : "Cadastrar Escola"}
                    </button>
                </div>
            </form>
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Cadastro</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Tem certeza que deseja{" "}
                    {escolaId
                        ? "salvar as alterações"
                        : "cadastrar esta escola"}
                    ?
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowModal(false)}
                    >
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        Confirmar
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default CadastroEscolaModal;