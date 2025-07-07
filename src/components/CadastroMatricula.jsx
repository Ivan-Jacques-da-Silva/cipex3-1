import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import InputMask from "react-input-mask";
import { API_BASE_URL } from "./config";
import { ToastContainer, toast } from "react-toastify";
import { Form, Row, Col, Button, Modal } from "react-bootstrap";
import './modal.css'

const CadastroMatricula = ({
    matriculaId,
}) => {
    const [usuarios, setUsuarios] = useState([]);
    const [dadosUsuario, setDadosUsuario] = useState({});
    const [cursos, setCursos] = useState([]);
    const [escolas, setEscolas] = useState([]);
    const [showAdditionalFields, setShowAdditionalFields] = useState(false);
    const [showParentFields, setShowParentFields] = useState(false);
    const [filteredUsuarios, setFilteredUsuarios] = useState([]);
    const [showUserSearchModal, setShowUserSearchModal] = useState(false);
    const inputSearchRef = useRef(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [acaoConfirmada, setAcaoConfirmada] = useState(null);
    const abrirModalConfirmacao = () => setShowConfirmModal(true);
    const fecharModalConfirmacao = () => setShowConfirmModal(false);


    // const [usuarioSelecionado, setUsuarioSelecionado] = useState();
    const [matriculaData, setMatriculaData] = useState({
        status: "ativo",
        numeroParcelas: "",
        valorParcela: 0,
        usuarioId: "",
        nomeUsuario: "",
        cpfUsuario: "",
        valorCurso: "",
        cursoId: "",
        escolaId: "",
        dataNascimento: "",
        profissao: "",
        estadoCivil: "",
        endereco: "",
        rua: "",
        numero: "",
        whatsapp: "",
        telefone: "",
        email: "",
        escolaridade: "",
        localNascimento: "",
        redeSocial: "",
        nomePai: "",
        contatoPai: "",
        nomeMae: "",
        contatoMae: "",
        horarioInicio: "",
        horarioFim: "",
        nivelIdioma: "",
        primeiraDataPagamento: "",
    });

    const limparCampos = () => {
        setMatriculaData({
            status: "ativo",
            numeroParcelas: "",
            valorParcela: "",
            usuarioId: "",
            nomeUsuario: "",
            cpfUsuario: "",
            valorCurso: "",
            cursoId: "",
            escolaId: "",
            dataNascimento: "",
            profissao: "",
            estadoCivil: "",
            endereco: "",
            rua: "",
            numero: "",
            whatsapp: "",
            telefone: "",
            email: "",
            escolaridade: "",
            localNascimento: "",
            redeSocial: "",
            nomePai: "",
            contatoPai: "",
            nomeMae: "",
            contatoMae: "",
            horarioInicio: "",
            horarioFim: "",
            nivelIdioma: "",
            primeiraDataPagamento: "",
        });
    };


    useEffect(() => {
        if (matriculaId) {
            axios.get(`${API_BASE_URL}/matriculas/${matriculaId}`)
                .then(response => {
                    if (response.data) {
                        setMatriculaData(prevData => ({
                            ...prevData,
                            ...response.data, // Atualiza o estado com os dados vindos da API
                            valorParcela: response.data.valorParcela || 0 // Garante que não seja undefined
                        }));
                        if (response.data.usuarioId) {
                            buscarDadosUsuario(response.data.usuarioId);
                        }
                    } else {
                        toast.error("Matrícula não encontrada.");
                    }
                })
                .catch(error => {
                    console.error("Erro ao buscar matrícula:", error);
                    toast.error("Erro ao buscar matrícula.");
                });
        }
    }, [matriculaId]);


    const buscarDadosUsuario = (usuarioId) => {
        axios.get(`${API_BASE_URL}/matricula/${usuarioId}`)
            .then(response => {
                if (response.data) {
                    setDadosUsuario(response.data); // Atualiza os dados do usuário

                    setMatriculaData(prevMatriculaData => ({
                        ...prevMatriculaData,
                        usuarioId: usuarioId, // Garante que o usuário seja identificado corretamente
                        nomeUsuario: response.data.nomeUsuario || "",
                        cpfUsuario: response.data.cpfUsuario || "",
                        dataNascimento: formatarData(response.data.dataNascimento) || "",
                        profissao: response.data.profissao || "",
                        estadoCivil: response.data.estadoCivil || "Não informado",
                        endereco: response.data.endereco || "",
                        whatsapp: response.data.whatsapp || "",
                        telefone: response.data.telefone || "",
                        email: response.data.email || "",
                        escolaId: response.data.escolaId || "",
                    }));

                } else {
                    toast.error("Usuário não encontrado.");
                }
            })
            .catch(error => {
                console.error("Erro ao buscar usuário:", error);
                toast.error("Erro ao buscar usuário.");
            });
    };



    useEffect(() => {
        if (showUserSearchModal && inputSearchRef.current) {
            inputSearchRef.current.focus();
        }
    }, [showUserSearchModal]);

    // Funções para abrir e fechar o modal
    const openUserSearchModal = () => {
        setFilteredUsuarios(usuarios); // Preenche a lista antes de abrir o modal
        setShowUserSearchModal(true);
    };

    const closeUserSearchModal = () => setShowUserSearchModal(false);

    useEffect(() => {
        if (!matriculaId) {
            axios
                .get(`${API_BASE_URL}/buscarusermatricula`)
                .then((response) => {
                    const schoolId = localStorage.getItem("schoolId");

                    const usuariosFiltrados = response.data.filter(usuario =>
                        usuario.cp_excluido !== 1 && usuario.cp_escola_id == schoolId
                    );

                    setUsuarios(usuariosFiltrados);
                    setFilteredUsuarios(usuariosFiltrados);
                })
                .catch((error) => {
                    console.error("Erro ao buscar usuários:", error);
                });
        }
    }, [matriculaId]);

    const calcularValorParcela = () => {
        const valorCurso = parseFloat(matriculaData.valorCurso);
        const numeroParcelas = parseInt(matriculaData.numeroParcelas, 10);

        if (!isNaN(valorCurso) && !isNaN(numeroParcelas) && numeroParcelas > 0) {
            const valorParcela = (valorCurso / numeroParcelas).toFixed(2);
            setMatriculaData(prevData => ({
                ...prevData,
                valorParcela: valorParcela
            }));
        }
    };

    useEffect(() => {
        calcularValorParcela();
    }, [matriculaData.valorCurso, matriculaData.numeroParcelas]);


    useEffect(() => {
        if (matriculaId) {
            calcularValorParcela();
        }
    }, [matriculaData.valorCurso]);

    useEffect(() => {
        if (matriculaId) {
            axios.get(`${API_BASE_URL}/matriculas/${matriculaId}`)
                .then(response => {
                    if (response.data) {
                        const dadosMatricula = response.data;

                        setMatriculaData(prevData => ({
                            ...prevData,
                            cursoId: dadosMatricula.cp_mt_curso,
                            escolaId: dadosMatricula.cp_mt_escola,
                            usuarioId: dadosMatricula.cp_mt_usuario,
                            nomeUsuario: dadosMatricula.cp_mt_nome_usuario,
                            cpfUsuario: dadosMatricula.cp_mt_cadastro_usuario,
                            valorCurso: dadosMatricula.cp_mt_valor_curso,
                            numeroParcelas: dadosMatricula.cp_mt_quantas_parcelas,
                            primeiraDataPagamento: dadosMatricula.cp_mt_primeira_parcela,
                            status: dadosMatricula.cp_status_matricula,
                            nivelIdioma: dadosMatricula.cp_mt_nivel,
                            horarioInicio: dadosMatricula.cp_mt_horario_inicio,
                            horarioFim: dadosMatricula.cp_mt_horario_fim,
                            escolaridade: dadosMatricula.cp_mt_escolaridade,
                            localNascimento: dadosMatricula.cp_mt_local_nascimento,
                            redeSocial: dadosMatricula.cp_mt_rede_social,
                            nomePai: dadosMatricula.cp_mt_nome_pai,
                            contatoPai: dadosMatricula.cp_mt_contato_pai,
                            nomeMae: dadosMatricula.cp_mt_nome_mae,
                            contatoMae: dadosMatricula.cp_mt_contato_mae,
                        }));

                        // Buscar os dados do usuário vinculado à matrícula
                        if (dadosMatricula.cp_mt_usuario) {
                            buscarDadosUsuario(dadosMatricula.cp_mt_usuario);
                        }
                    } else {
                        toast.error("Matrícula não encontrada.");
                    }
                })
                .catch(error => {
                    console.error("Erro ao buscar matrícula:", error);
                    toast.error("Erro ao buscar matrícula.");
                });
        }
    }, [matriculaId]);



    const loadDefaultLanguageLevels = () => {
        return [
            { id: "basico", nome: "Básico" },
            { id: "intermediario", nome: "Intermediário" },
            { id: "avancado", nome: "Avançado" },
        ];
    };



    const defaultLanguageLevels = loadDefaultLanguageLevels();

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        try {
            const formatarData = (data) => {
                return data ? new Date(data).toISOString().split('T')[0] : null;
            };

            if (matriculaId) {
                const editObj = {
                    cursoId: matriculaData.cursoId,
                    usuarioId: matriculaData.usuarioId,
                    escolaId: matriculaData.escolaId,
                    nomeUsuario: matriculaData.nomeUsuario,
                    cpfUsuario: matriculaData.cpfUsuario,
                    valorCurso: matriculaData.valorCurso,
                    numeroParcelas: matriculaData.numeroParcelas,
                    primeiraDataPagamento: formatarData(matriculaData.primeiraDataPagamento),
                    status: matriculaData.status,
                    nivelIdioma: matriculaData.nivelIdioma,
                    horarioInicio: matriculaData.horarioInicio,
                    horarioFim: matriculaData.horarioFim,
                    localNascimento: matriculaData.localNascimento,
                    escolaridade: matriculaData.escolaridade,
                    redeSocial: matriculaData.redeSocial,
                    nomePai: matriculaData.nomePai,
                    contatoPai: matriculaData.contatoPai,
                    nomeMae: matriculaData.nomeMae,
                    contatoMae: matriculaData.contatoMae,
                };

                const response = await axios.put(`${API_BASE_URL}/editar-matricula/${matriculaId}`, editObj);
                if (response.data?.msg === "Matrícula e parcelas atualizadas com sucesso") {
                    toast.success("Matrícula editada com sucesso");
                } else {
                    toast.error("Erro ao editar matrícula");
                }
            } else {
                const createObj = {
                    ...matriculaData,
                    primeiraDataPagamento: formatarData(matriculaData.primeiraDataPagamento),
                };

                const response = await axios.post(`${API_BASE_URL}/cadastrar-matricula`, createObj);
                if (response.data?.msg === "Matrícula cadastrada com sucesso") {
                    toast.success("Matrícula cadastrada com sucesso");
                    limparCampos();
                } else {
                    toast.error("Erro ao cadastrar matrícula");
                }
            }
        } catch (error) {
            console.error("Erro ao processar matrícula:", error);
            toast.error("Erro ao processar matrícula");
        }
    };




    const handleUsuarioChange = (e) => {
        const selectedUserId = e.target.value;

        if (selectedUserId) {
            axios.get(`${API_BASE_URL}/buscarusermatricula/${selectedUserId}`)
                .then(response => {
                    if (response.data) {
                        const usuario = response.data;
                        setDadosUsuario(usuario);

                        setMatriculaData(prevMatriculaData => ({
                            ...prevMatriculaData,
                            usuarioId: usuario.cp_id,
                            nomeUsuario: usuario.cp_nome,
                            cpfUsuario: usuario.cp_cpf,
                            dataNascimento: usuario.cp_datanascimento,
                            profissao: usuario.cp_profissao,
                            estadoCivil: usuario.cp_estadocivil,
                            endereco: `${usuario.cp_end_cidade_estado}, ${usuario.cp_end_rua}, ${usuario.cp_end_num}`,
                            whatsapp: usuario.cp_whatsapp,
                            telefone: usuario.cp_telefone,
                            email: usuario.cp_email,
                            // escolaridade: usuario.cp_escolaridade,
                            escolaId: usuario.cp_escola_id
                        }));
                    } else {
                        console.error("Usuário não encontrado:", response.data);
                        toast.error("Usuário não encontrado");
                    }
                })
                .catch(error => {
                    console.error("Erro ao buscar dados do usuário:", error);
                    toast.error("Erro ao buscar dados do usuário");
                });
        } else {
            setDadosUsuario({});
            setMatriculaData({
                ...matriculaData,
                usuarioId: '',
                nomeUsuario: '',
                cpfUsuario: '',
                dataNascimento: '',
                profissao: '',
                estadoCivil: '',
                endereco: '',
                whatsapp: '',
                telefone: '',
                email: '',
                escolaridade: '',
                escolaId: ''
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setMatriculaData({
            ...matriculaData,
            [name]: value,
        });
    };

    const formatarData = (dataString) => {
        if (!dataString) return "";

        // Verifica se a data já está no formato correto
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
            return dataString;
        }

        const data = new Date(dataString);

        // Se a data for inválida, retorna uma string vazia
        if (isNaN(data.getTime())) return "";

        const ano = data.getFullYear().toString().padStart(4, "0"); // Garante 4 dígitos no ano
        const mes = (data.getMonth() + 1).toString().padStart(2, "0");
        const dia = data.getDate().toString().padStart(2, "0");

        return `${ano}-${mes}-${dia}`; // Retorna no formato YYYY-MM-DD
    };




    const handleNumeroParcelasChange = (e) => {
        const { value } = e.target;

        const valorCurso = matriculaData.valorCurso;
        const numeroParcelas = parseInt(value, 10);

        if (!isNaN(numeroParcelas) && numeroParcelas > 0) {
            const valorParcela = (valorCurso / numeroParcelas).toFixed(2);
            setMatriculaData((prevMatriculaData) => ({
                ...prevMatriculaData,
                numeroParcelas: value,
                valorParcela: valorParcela,
            }));
        } else {
            setMatriculaData((prevMatriculaData) => ({
                ...prevMatriculaData,
                numeroParcelas: "",
                valorParcela: "",
            }));
        }
    };

    useEffect(() => {
        fetchCursos();
        fetchEscolas();
    }, []);

    const fetchCursos = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/cursos`);
            if (Array.isArray(response.data)) {
                setCursos(response.data);
            } else {
                console.error(
                    "Formato de resposta inválido para cursos:",
                    response.data
                );
                toast.error("Formato de resposta inválido para cursos");
            }
        } catch (error) {
            console.error("Erro ao buscar cursos:", error);
            toast.error("Erro ao buscar cursos");
        }
    };

    const fetchEscolas = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/escolas`);
            if (Array.isArray(response.data)) {
                setEscolas(response.data);
            } else {
                console.error(
                    "Formato de resposta inválido para escolas:",
                    response.data
                );
                toast.error("Formato de resposta inválido para escolas:");
            }
        } catch (error) {
            console.error("Erro ao buscar escolas:", error);
            toast.error("Erro ao buscar escolas:");
        }
    };

    const handleParentDataChange = (e) => {
        const isChecked = e.target.checked;
        // Não feche o campo se os valores estiverem em branco
        if (!isChecked) {
            const hasValues =
                matriculaData.nomePai.trim() ||
                matriculaData.contatoPai.trim() ||
                matriculaData.nomeMae.trim() ||
                matriculaData.contatoMae.trim();
            if (hasValues) {
                toast.error("Preencha ou limpe os campos antes de fechar.");
                return;
            }
        }
        setShowParentFields(isChecked);
    };




    const toggleAdditionalFields = () => {
        setShowAdditionalFields(!showAdditionalFields);
    };
    const toggleParentFields = () => {
        setShowParentFields(!showParentFields);
    };

    useEffect(() => {
        const hasParentData =
            matriculaData.nomePai !== "" ||
            matriculaData.contatoPai !== "" ||
            matriculaData.nomeMae !== "" ||
            matriculaData.contatoMae !== "";

        setShowParentFields(hasParentData);
    }, [
        matriculaData.nomePai,
        matriculaData.contatoPai,
        matriculaData.nomeMae,
        matriculaData.contatoMae,
    ]);


    useEffect(() => {
        const hasAdditionalData =
            matriculaData.escolaridade !== "" ||
            matriculaData.localNascimento !== "" ||
            matriculaData.redeSocial !== "";

        setShowAdditionalFields(hasAdditionalData);
    }, [
        matriculaData.escolaridade,
        matriculaData.localNascimento,
        matriculaData.redeSocial,
    ]);

    const handleAdditionalDataChange = (e) => {
        setShowAdditionalFields(e.target.checked);

    };

    const handleUsuarioSearch = (e) => {
        const termoBusca = e.target.value.toLowerCase();
        setMatriculaData((prev) => ({ ...prev, nomeUsuario: e.target.value })); // Atualiza o input de nome

        if (!termoBusca) {
            setFilteredUsuarios(usuarios); // Se vazio, mostra todos
        } else {
            const filtrados = usuarios.filter(usuario =>
                usuario.cp_nome.toLowerCase().includes(termoBusca)
            );
            setFilteredUsuarios(filtrados);
        }

        setShowUserSearchModal(true); // Abre o modal automaticamente
    };



    const handleUsuarioSelect = (usuario) => {
        setDadosUsuario(usuario);
        setMatriculaData(prevMatriculaData => ({
            ...prevMatriculaData,
            usuarioId: usuario.cp_id,
            nomeUsuario: usuario.cp_nome,
            cpfUsuario: usuario.cp_cpf,
            dataNascimento: usuario.cp_datanascimento,
            profissao: usuario.cp_profissao,
            estadoCivil: usuario.cp_estadocivil,
            endereco: `${usuario.cp_end_cidade_estado}, ${usuario.cp_end_rua}, ${usuario.cp_end_num}`,
            whatsapp: usuario.cp_whatsapp,
            telefone: usuario.cp_telefone,
            email: usuario.cp_email,
            escolaId: usuario.cp_escola_id,
        }));
        closeUserSearchModal(); // Fecha o modal após selecionar
    };

    return (
        <div className="modal-edit">
            <ToastContainer />
            <form className="form-container-cad" onSubmit={handleSubmit}>
                <Row>
                    <Col md={6}>
                        <div className="card mb-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Dados Pessoais</h6>
                            </div>
                            <div className="card-body">
                                <Row className="gy-3">
                                    {matriculaId ? (
                                        // Edição: Apenas exibe os dados sem permitir edição
                                        <Col md={12}>
                                            <label htmlFor="nomeUsuario">Usuário:</label>
                                            <input
                                                type="text"
                                                id="nomeUsuario"
                                                name="nomeUsuario"
                                                value={matriculaData.nomeUsuario || ""}
                                                className="form-control"
                                                placeholder="Nome do usuário"
                                                required
                                                readOnly
                                            />
                                        </Col>
                                    ) : (
                                        // Cadastro: Permite pesquisa ao clicar
                                        <Col md={12}>
                                            <label htmlFor="nomeUsuario">Nome do Usuário:</label>
                                            <input
                                                type="text"
                                                id="nomeUsuario"
                                                name="nomeUsuario"
                                                value={matriculaData.nomeUsuario || ""}
                                                className="form-control border-primary text-base"
                                                placeholder="Clique para pesquisar um aluno"
                                                required
                                                readOnly
                                                onClick={openUserSearchModal}
                                            />
                                        </Col>
                                    )}


                                    <Col md={12}>
                                        <label htmlFor="cpfUsuario">CPF do Usuário:</label>
                                        <InputMask
                                            type="text"
                                            id="cpfUsuario"
                                            name="cpfUsuario"
                                            mask="999.999.999-99"
                                            value={matriculaData.cpfUsuario}
                                            className="form-control"
                                            placeholder="CPF"
                                            required
                                            readOnly
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="dataNascimento">Data de Nascimento:</label>
                                        <input
                                            type="date"
                                            id="dataNascimento"
                                            name="dataNascimento"
                                            value={formatarData(dadosUsuario.dataNascimento) || ""}
                                            className="form-control"
                                            readOnly
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="profissao">Profissão:</label>
                                        <input
                                            type="text"
                                            id="profissao"
                                            name="profissao"
                                            value={dadosUsuario.profissao || ""}
                                            className="form-control"
                                            placeholder="Profissão"
                                            readOnly
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="estadoCivil">Estado Civil:</label>
                                        <input
                                            type="text"
                                            id="estadoCivil"
                                            name="estadoCivil"
                                            value={dadosUsuario.estadoCivil || "Não informado"}
                                            className="form-control"
                                            placeholder="Estado Civil"
                                            readOnly
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="endereco">Endereço:</label>
                                        <input
                                            type="text"
                                            id="endereco"
                                            name="endereco"
                                            value={`${dadosUsuario.endereco || ""}`}
                                            className="form-control"
                                            placeholder="Endereço"
                                            rows={2}
                                            readOnly
                                        />
                                    </Col>

                                    <Col md={12}>
                                        <label htmlFor="whatsapp">Whatsapp:</label>
                                        <InputMask
                                            mask="(99) 99999-9999"
                                            value={dadosUsuario.whatsapp || ""}
                                            className="form-control"
                                            placeholder="Whatsapp"
                                            readOnly
                                        />
                                    </Col>

                                    <Col md={12}>
                                        <label htmlFor="telefone">Telefone:</label>
                                        <InputMask
                                            mask="(99) 99999-9999"
                                            value={dadosUsuario.telefone || ""}
                                            className="form-control"
                                            placeholder="Telefone"
                                            readOnly
                                        />
                                    </Col>

                                    <Col md={12}>
                                        <label htmlFor="email">Email:</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            value={dadosUsuario.email || ""}
                                            className="form-control"
                                            placeholder="Email"
                                            readOnly
                                        />
                                    </Col>

                                    <Col md={12}>
                                        <label htmlFor="escolaId">Escola:</label>
                                        <input
                                            type="text"
                                            id="escolaId"
                                            name="escolaId"
                                            value={
                                                escolas.find(
                                                    (escola) => escola.cp_ec_id === dadosUsuario.escolaId
                                                )?.cp_ec_nome || ""
                                            }
                                            className="form-control"
                                            placeholder="Escola"
                                            readOnly
                                        />
                                    </Col>

                                </Row>
                            </div>
                        </div>

                        <div className="card mb-3 mt-4">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Dados Adicionais</h6>
                            </div>
                            <div className="card-body">
                                <Col md={12}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            id="showAdditionalFields"
                                            name="showAdditionalFields"
                                            checked={showAdditionalFields}
                                            onChange={handleAdditionalDataChange}
                                            className="form-check-input"
                                        />
                                        Exibir Dados Adicionais
                                    </label>
                                </Col>

                                {showAdditionalFields && (
                                    <div className="card mt-3">
                                        <Row className="gy-3">
                                            <Col md={12}>
                                                <label htmlFor="escolaridade">Escolaridade:</label>
                                                <select
                                                    id="escolaridade"
                                                    name="escolaridade"
                                                    value={matriculaData.escolaridade}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                >
                                                    <option value="">Selecione...</option>
                                                    <option value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</option>
                                                    <option value="Ensino Fundamental Completo">Ensino Fundamental Completo</option>
                                                    <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                                                    <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                                                    <option value="Técnico Incompleto">Técnico Incompleto</option>
                                                    <option value="Técnico Completo">Técnico Completo</option>
                                                    <option value="Superior Incompleto">Superior Incompleto</option>
                                                    <option value="Superior Completo">Superior Completo</option>
                                                    <option value="Pós-graduação">Pós-graduação</option>
                                                    <option value="Mestrado">Mestrado</option>
                                                    <option value="Doutorado">Doutorado</option>
                                                    <option value="Outra Graduação">Outra Graduação</option>
                                                </select>
                                            </Col>
                                            <Col md={12}>
                                                <label htmlFor="localNascimento">Local de Nascimento:</label>
                                                <input
                                                    type="text"
                                                    id="localNascimento"
                                                    name="localNascimento"
                                                    value={matriculaData.localNascimento}
                                                    onChange={(e) =>
                                                        setMatriculaData({
                                                            ...matriculaData,
                                                            localNascimento: e.target.value,
                                                        })
                                                    }
                                                    className="form-control"
                                                    placeholder="Local de Nascimento"
                                                />
                                            </Col>
                                            <Col md={12}>
                                                <label htmlFor="redeSocial">Link de Rede Social:</label>
                                                <input
                                                    type="text"
                                                    id="redeSocial"
                                                    name="redeSocial"
                                                    value={matriculaData.redeSocial}
                                                    onChange={(e) =>
                                                        setMatriculaData({
                                                            ...matriculaData,
                                                            redeSocial: e.target.value,
                                                        })
                                                    }
                                                    className="form-control"
                                                    placeholder="Link de Rede Social"
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                )}
                            </div>
                        </div>

                    </Col>

                    <Col md={6}>
                        <div className="card mb-3">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Dados do Curso</h6>
                            </div>
                            <div className="card-body">
                                <Row className="gy-3">
                                    <Col md={12}>
                                        <label htmlFor="cursoId">Curso:</label>
                                        <select
                                            id="cursoId"
                                            name="cursoId"
                                            value={matriculaData.cursoId}
                                            onChange={(e) =>
                                                setMatriculaData({
                                                    ...matriculaData,
                                                    cursoId: e.target.value,
                                                })
                                            }
                                            className="form-control"
                                            required
                                        >
                                            <option value="">Selecione o curso</option>
                                            {cursos.map((curso) => (
                                                <option key={curso.cp_curso_id} value={curso.cp_curso_id}>
                                                    {curso.cp_nome_curso}
                                                </option>
                                            ))}
                                        </select>
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="nivelIdioma">Nível do Idioma:</label>
                                        <select
                                            id="nivelIdioma"
                                            name="nivelIdioma"
                                            value={matriculaData.nivelIdioma}
                                            onChange={(e) =>
                                                setMatriculaData({
                                                    ...matriculaData,
                                                    nivelIdioma: e.target.value,
                                                })
                                            }
                                            className="form-control"
                                        >
                                            <option value="">Selecione o nível do idioma</option>
                                            {defaultLanguageLevels.map((level) => (
                                                <option key={level.id} value={level.nome}>
                                                    {level.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="horarioInicio">Horário:</label>
                                        <Row>
                                            <Col xs={5}>
                                                <InputMask
                                                    type="text"
                                                    id="horarioInicio"
                                                    name="horarioInicio"
                                                    mask="99:99"
                                                    value={matriculaData.horarioInicio}
                                                    onChange={(e) =>
                                                        setMatriculaData({
                                                            ...matriculaData,
                                                            horarioInicio: e.target.value,
                                                        })
                                                    }
                                                    className="form-control"
                                                    placeholder="Horário de início"
                                                />
                                            </Col>
                                            <Col xs={2}>
                                                <span className="horario-span">até</span>
                                            </Col>
                                            <Col xs={5}>
                                                <InputMask
                                                    type="text"
                                                    id="horarioFim"
                                                    name="horarioFim"
                                                    mask="99:99"
                                                    value={matriculaData.horarioFim}
                                                    onChange={(e) =>
                                                        setMatriculaData({
                                                            ...matriculaData,
                                                            horarioFim: e.target.value,
                                                        })
                                                    }
                                                    className="form-control"
                                                    placeholder="Horário de término"
                                                />
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="status">Status:</label>
                                        <select
                                            id="status"
                                            name="status"
                                            value={matriculaData.status}
                                            onChange={handleInputChange}
                                            className="form-control"
                                            required
                                        >
                                            <option value="ativo">Ativo</option>
                                            <option value="cancelado">Cancelado</option>
                                            <option value="trancado">Trancado</option>
                                            <option value="concluido">Concluído</option>
                                        </select>
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="valorCurso">Valor do Curso:</label>
                                        <input
                                            type="number"
                                            id="valorCurso"
                                            name="valorCurso"
                                            value={matriculaData.valorCurso}
                                            onChange={(e) =>
                                                setMatriculaData({
                                                    ...matriculaData,
                                                    valorCurso: e.target.value,
                                                })
                                            }
                                            className="form-control"
                                            placeholder="Valor do Curso"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="numeroParcelas">Número de Parcelas:</label>
                                        <select
                                            id="numeroParcelas"
                                            name="numeroParcelas"
                                            value={matriculaData.numeroParcelas || ''}
                                            onChange={handleNumeroParcelasChange}
                                            className="form-control"
                                            disabled={!matriculaData.valorCurso}
                                            required
                                        >
                                            <option value="">Selecione o número de parcelas</option>
                                            {[...Array(13)].map((_, i) => (
                                                <option key={i + 1} value={i + 1}>
                                                    {i + 1}x
                                                </option>
                                            ))}
                                        </select>
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="primeiraParcela">Primeira Parcela:</label>
                                        <input
                                            type="date"
                                            id="primeiraParcela"
                                            name="primeiraParcela"
                                            value={formatarData(matriculaData.primeiraDataPagamento) || ""}
                                            onChange={(e) =>
                                                setMatriculaData({
                                                    ...matriculaData,
                                                    primeiraDataPagamento: e.target.value, // Mantém no formato correto
                                                })
                                            }
                                            className="form-control"
                                            required
                                        />
                                    </Col>
                                    <Col md={12}>
                                        <label htmlFor="valorParcela">Valor da Parcela:</label>
                                        <input
                                            type="text"
                                            id="valorParcela"
                                            name="valorParcela"
                                            value={Number(matriculaData.valorParcela).toLocaleString(
                                                "pt-BR",
                                                {
                                                    minimumFractionDigits: 2,
                                                }
                                            )}
                                            className="form-control"
                                            placeholder="Valor da Parcela"
                                            readOnly
                                        />
                                    </Col>
                                </Row>
                            </div>
                        </div>
                        <div className="card mb-3 mt-4">
                            <div className="card-header">
                                <h6 className="card-title mb-0">Dados do Responsável</h6>
                            </div>

                            <div className="card-body">
                                <Col md={12}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            id="showParentFields"
                                            name="showParentFields"
                                            checked={showParentFields}
                                            onChange={handleParentDataChange}
                                            className="form-check-input"
                                        /> Aluno menor de 18 anos
                                    </label>
                                </Col>

                                {showParentFields && (
                                    <div className="card mt-3">
                                        {/* <div className="card-header">
                                        <h6 className="card-title mb-0">Dados do Responsável</h6>
                                    </div> */}
                                        <Row className="gy-3">
                                            <Col md={6}>
                                                <label htmlFor="nomePai">Nome do Pai:</label>
                                                <input
                                                    type="text"
                                                    id="nomePai"
                                                    name="nomePai"
                                                    value={matriculaData.nomePai || ''}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    placeholder="Nome do pai/responsável"
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <label htmlFor="contatoPai">Contato do Pai:</label>
                                                <InputMask
                                                    type="text"
                                                    id="contatoPai"
                                                    name="contatoPai"
                                                    mask="(99) 99999-9999"
                                                    value={matriculaData.contatoPai || ''}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    placeholder="Contato do pai/responsável"
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <label htmlFor="nomeMae">Nome da Mãe:</label>
                                                <input
                                                    type="text"
                                                    id="nomeMae"
                                                    name="nomeMae"
                                                    value={matriculaData.nomeMae || ''}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    placeholder="Nome da mãe/responsável"
                                                />
                                            </Col>
                                            <Col md={6}>
                                                <label htmlFor="contatoMae">Contato da Mãe:</label>
                                                <InputMask
                                                    type="text"
                                                    id="contatoMae"
                                                    name="contatoMae"
                                                    mask="(99) 99999-9999"
                                                    value={matriculaData.contatoMae || ''}
                                                    onChange={handleInputChange}
                                                    className="form-control"
                                                    placeholder="Contato da mãe/responsável"
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                )}

                            </div>
                        </div>
                    </Col>
                </Row>

                <div className="text-center mt-4">
                    <button type="button" className="btn btn-primary me-2" onClick={abrirModalConfirmacao}>
                        {matriculaId ? 'Atualizar Matrícula' : 'Cadastrar Matrícula'}
                    </button>

                </div>
            </form>
            <Modal show={showUserSearchModal} onHide={closeUserSearchModal} centered animation={false}>
                <Modal.Header closeButton>
                    <Modal.Title>Pesquisar Usuário</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <input
                        type="text"
                        id="usuarioSearch"
                        name="usuarioSearch"
                        onChange={handleUsuarioSearch}
                        className="form-control"
                        placeholder="Digite para pesquisar"
                        ref={inputSearchRef}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && filteredUsuarios.length > 0) {
                                handleUsuarioSelect(filteredUsuarios[0]); // Seleciona o primeiro da lista
                                closeUserSearchModal(); // Fecha o modal
                            }
                        }}
                    />
                    <ul className="list-group mt-2">
                        {filteredUsuarios.length > 0 ? (
                            filteredUsuarios.map((usuario) => (
                                <li
                                    key={usuario.cp_id}
                                    className="list-group-item list-group-item-action"
                                    onClick={() => {
                                        handleUsuarioSelect(usuario);
                                        closeUserSearchModal();
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    {usuario.cp_nome} - {usuario.cp_cpf}
                                </li>
                            ))
                        ) : (
                            <li className="list-group-item">Nenhum usuário encontrado</li>
                        )}
                    </ul>
                </Modal.Body>
            </Modal>
            <Modal show={showConfirmModal} onHide={fecharModalConfirmacao} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmação</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Tem certeza que deseja {matriculaId ? "atualizar" : "cadastrar"} esta matrícula?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={fecharModalConfirmacao}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={(e) => {
                        fecharModalConfirmacao();
                        handleSubmit(e);
                    }}>
                        Confirmar
                    </Button>


                </Modal.Footer>
            </Modal>

        </div>
    );


};

export default CadastroMatricula;
