import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Icon } from '@iconify/react/dist/iconify.js';

import axios from "axios";
import {
  Row,
  Col,
  Card,
  Button,
  Container,
  Form,
  Modal,
  Image,
} from "react-bootstrap";
import { FaFilePdf, FaDownload, FaTrash, FaEdit } from "react-icons/fa";
import { API_BASE_URL } from "./config";
import ModalVideo from "react-modal-video";


const Treinamento = () => {
  const [materiais, setMateriais] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    linkYoutube: "",
    arquivoPdf1: null,
    arquivoPdf2: null,
    arquivoPdf3: null,
    miniatura: null,
    data: "",
    categorias: "",
  });
  const [codigos, setCodigos] = useState([]);
  const [filteredMateriais, setFilteredMateriais] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showPDF, setShowPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [userType, setUserType] = useState(null);
  const [isOpen, setOpen] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [selectedCodigos, setSelectedCodigos] = useState([]);

  const getUserType = () => {
    const userType = localStorage.getItem("userType");
    return userType ? parseInt(userType, 10) : null;
  };

  const opcoesCodigos = [
    { valor: "KIDS", etiqueta: "KIDS" },
    { valor: "TWEENS", etiqueta: "TWEENS" },
    { valor: "CES", etiqueta: "CES" },
    { valor: "CONVERSATION", etiqueta: "CONVERSATION" },
    { valor: "ESPANHOL", etiqueta: "ESPANHOL" },
    { valor: "DEUTSCH", etiqueta: "DEUTSCH" }
  ];
  const lidarCheckBox = (valor) => {
    setCodigos(prev =>
      prev.includes(valor) ? prev.filter(v => v !== valor) : [...prev, valor]
    );
  };

  const handleCodigoFilterChange = (event) => {
    const codigo = event.target.name;
    setSelectedCodigos(prev =>
      prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]
    );
  };

  const handleEdit = (material) => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    setFormData({
      id: material.cp_mat_id || "",
      titulo: material.cp_mat_titulo || "",
      descricao: material.cp_mat_descricao || "",
      linkYoutube: material.cp_mat_linkYoutube || "",
      arquivoPdf1: material.cp_mat_arquivoPdf || null,
      arquivoPdf2: material.cp_mat_extra_pdf2 || null,
      arquivoPdf3: material.cp_mat_extra_pdf3 || null,
      miniatura: material.cp_mat_miniatura || null,
      data: material.cp_mat_extra_date || "",
      categorias: material.cp_mat_extra_categories || "",
      permitirDownload: material.cp_mat_permitirDownload === 1,
    });
  };


  const truncarTexto = (texto, max = 15) => {
    if (!texto) return "";
    return texto.length > max ? texto.substring(0, max) + "..." : texto;
  };



  useEffect(() => {
    const userType = getUserType();
    setUserType(userType);
  }, []);

  useEffect(() => {
    fetchMateriais();
  }, []);

  const mapaCursosParaCodigo = {
    "CIPEX ENGLISH BOOK 1": "CES",
    "CIPEX ENGLISH BOOK 2": "CES",
    "CIPEX ENGLISH BOOK 3": "CES",
    "CIPEX ENGLISH BOOK 4": "CES",
    "CIPEX ENGLISH BOOK 5": "CES",
    "CIPEX ENGLISH BOOK 6": "CES",
    "CIPEX TWEENS 2": "TWEENS",
    "CIPEX TWEENS 3": "TWEENS",
    "CIPEX TWEENS 4": "TWEENS",
    "CIPEX TEENS BOOK 5": "TWEENS",
    "FERRIS WHEEL BOOK 1": "KIDS",
    "FERRIS WHEEL BOOK 2": "KIDS",
    "NEXT STATION STARTER": "KIDS",
    "NEXT STATION BOOK 1": "KIDS",
    "NEXT STATION BOOK 2": "KIDS",
    "TV BOX CONVERSATION VOL. 1": "CONVERSATION",
    "TV BOX CONVERSATION VOL. 2": "CONVERSATION",
    "MOMENTE A1": "DEUTSCH",
    "MOMENTE A2": "DEUTSCH",
    "ASPEKTE B2": "DEUTSCH",
    "NUEVO ESPAÑOL EN MARCHA 1": "ESPANHOL",
    "NUEVO ESPAÑOL EN MARCHA 2": "ESPANHOL"
  };



  useEffect(() => {
    if (userType !== 1) {
      const professorId = localStorage.getItem("userId");
      axios.get(`${API_BASE_URL}/cp_turmas/professor/${professorId}`)
        .then(res => {
          const cursosDoProfessor = res.data.map(turma => turma.cp_tr_curso_id);
          axios.post(`${API_BASE_URL}/cursos/batch`, { cursoIds: cursosDoProfessor })
            .then(resCursos => {
              const nomesCursos = resCursos.data.map(curso => curso.cp_nome_curso);
              const codigosPermitidos = [...new Set(
                nomesCursos.map(nome => mapaCursosParaCodigo[nome]).filter(Boolean)
              )];
              const materiaisPermitidos = materiais.filter(material => {
                const codigosMaterial = material.cp_mat_extra_codigos
                  ? material.cp_mat_extra_codigos.split(",").map(c => c.trim())
                  : [];
                return codigosMaterial.some(codigo => codigosPermitidos.includes(codigo));
              });
              setFilteredMateriais(materiaisPermitidos);
            })
            .catch(err => console.error("Erro no batch de cursos:", err));
        })
        .catch(err => console.error("Erro ao buscar turmas do professor:", err));
    }
  }, [materiais, userType]);


  const fetchMateriais = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/materiais`);
      const todosMateriais = res.data;
      setMateriais(todosMateriais);

      if (getUserType() === 1) {
        // Usuário admin: mostra tudo
        setFilteredMateriais(todosMateriais);
      } else {
        // Professor: filtra antes de atualizar o estado
        const professorId = localStorage.getItem("userId");
        const resTurmas = await axios.get(`${API_BASE_URL}/cp_turmas/professor/${professorId}`);
        const cursosDoProfessor = resTurmas.data.map(turma => turma.cp_tr_curso_id);
        const resCursos = await axios.post(`${API_BASE_URL}/cursos/batch`, { cursoIds: cursosDoProfessor });
        const nomesCursos = resCursos.data.map(curso => curso.cp_nome_curso);
        const codigosPermitidos = [...new Set(
          nomesCursos.map(nome => mapaCursosParaCodigo[nome]).filter(Boolean)
        )];
        const materiaisPermitidos = todosMateriais.filter(material => {
          const codigosMaterial = material.cp_mat_extra_codigos
            ? material.cp_mat_extra_codigos.split(",").map(c => c.trim())
            : [];
          return codigosMaterial.some(codigo => codigosPermitidos.includes(codigo));
        });
        setFilteredMateriais(materiaisPermitidos);
      }
    } catch (error) {
      console.error("Erro ao buscar materiais", error);
    }
  };


  const handleViewPDF = (url) => {
    setPdfUrl(url);
    setShowPDF(true);
  };

  const handleOpenVideo = (url) => {
    const videoUrlNormalizado = normalizarUrlYoutube(url);
    const videoId = videoUrlNormalizado.split("embed/")[1]; // Extrai o ID do vídeo
    setVideoId(videoId);
    setOpen(true);
  };


  const handleClose = () => {
    setShowPDF(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData({ ...formData, [name]: files[0] });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataObj = new FormData();

    formDataObj.append("titulo", formData.titulo);
    formDataObj.append("descricao", formData.descricao);
    formDataObj.append("linkYoutube", formData.linkYoutube);
    formDataObj.append("data", formData.data);
    formDataObj.append("categorias", formData.categorias);
    formDataObj.append("codigos", codigos.join(","));
    formDataObj.append("permitirDownload", formData.permitirDownload ? 1 : 0); // Inclua o campo permitirDownload

    if (formData.arquivoPdf1 instanceof File) {
      formDataObj.append("arquivoPdf1", formData.arquivoPdf1);
    }
    if (formData.arquivoPdf2 instanceof File) {
      formDataObj.append("arquivoPdf2", formData.arquivoPdf2);
    }
    if (formData.arquivoPdf3 instanceof File) {
      formDataObj.append("arquivoPdf3", formData.arquivoPdf3);
    }
    if (formData.miniatura instanceof File) {
      formDataObj.append("miniatura", formData.miniatura);
    }

    try {
      if (formData.id) {
        // Atualiza material existente
        await axios.put(`${API_BASE_URL}/materiais/${formData.id}`, formDataObj);
        toast.success("Material atualizado com sucesso!");
      } else {
        // Cria novo material
        await axios.post(`${API_BASE_URL}/materiais`, formDataObj);
        toast.success("Material cadastrado com sucesso!");
      }

      fetchMateriais(); // Atualiza a lista após salvar

      // Limpar formulário
      setFormData({
        id: "",
        titulo: "",
        descricao: "",
        linkYoutube: "",
        arquivoPdf1: null,
        arquivoPdf2: null,
        arquivoPdf3: null,
        miniatura: null,
        data: "",
        categorias: "",
        permitirDownload: false,
      });
    } catch (error) {
      console.error("Erro ao enviar o formulário:", error);
      toast.error("Erro ao salvar o material.");
    }
  };


  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/materiais/${id}`);
      fetchMateriais();
    } catch (error) {
      console.error("Erro ao excluir material:", error);
    }
  };

  const handleDownload = async (pdfUrls) => {
    setIsDownloading(true);
    let successCount = 0;

    try {
      for (let pdfUrl of pdfUrls) {
        if (pdfUrl) {
          const relativePath = pdfUrl.replace(API_BASE_URL, '');
          window.open(`${API_BASE_URL}/proxy-download?url=${encodeURIComponent(relativePath)}`, '_blank');
          successCount++;
        }
      }
      if (successCount > 0) {
        toast.success(`${successCount} arquivo(s) baixado(s) com sucesso!`);
      } else {
        toast.error("Nenhum arquivo foi baixado.");
      }
    } catch (error) {
      console.error("Erro ao baixar arquivos:", error);
      toast.error("Erro ao baixar os arquivos.");
    } finally {
      setIsDownloading(false);
    }
  };

  const normalizarUrlYoutube = (url) => {
    let videoId = '';
    if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    }
    else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    return `https://www.youtube.com/embed/${videoId}`;
  };



  const handleCategoryChange = (event) => {
    const category = event.target.name;
    setSelectedCategories((prevCategories) =>
      prevCategories.includes(category)
        ? prevCategories.filter((c) => c !== category)
        : [...prevCategories, category]
    );
  };

  const formatDateString = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) {
      // If date is invalid, try parsing it manually
      const [year, month, day] = dateString.split("-");
      return `${day}/${month}/${year}`;
    }
    return date.toLocaleDateString("pt-BR");
  };

  // const removeAccents = (str) => {
  //   return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // };

  const applyFilter = () => {
    let filtered = materiais;

    // Filtro de Categorias
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((material) => {
        const materialCategories = material.cp_mat_extra_categories
          ? material.cp_mat_extra_categories.split(",").map((cat) => cat.trim())
          : [];
        return selectedCategories.some((category) =>
          materialCategories.includes(category)
        );
      });
    }

    if (selectedCodigos.length > 0) {
      filtered = filtered.filter((material) => {
        const materialCodigos = material.cp_mat_extra_codigos
          ? material.cp_mat_extra_codigos.split(",").map(c => c.trim())
          : [];
        return selectedCodigos.some(codigo => materialCodigos.includes(codigo));
      });
    }


    // Filtro de Nome
    if (searchTerm) {
      const lowerCaseTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (material) =>
          material.cp_mat_titulo &&
          material.cp_mat_titulo.toLowerCase().includes(lowerCaseTerm)
      );
    }

    // Filtro de Data
    if (filterDate) {
      filtered = filtered.filter((material) => {
        const materialDate = material.cp_mat_extra_date.split("T")[0];
        return materialDate === filterDate;
      });
    }

    setFilteredMateriais(filtered);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 3 - uploadedPDFCount());
    const updatedFiles = { ...formData };

    files.forEach((file, idx) => {
      const pdfKey = `arquivoPdf${uploadedPDFCount() + idx + 1}`;
      updatedFiles[pdfKey] = file;
    });

    setFormData(updatedFiles);
  };

  const uploadedPDFCount = () => {
    return [formData.arquivoPdf1, formData.arquivoPdf2, formData.arquivoPdf3].filter(Boolean).length;
  };


  return (
    <Container fluid>
      <style>
        {`
          .custom-switch .form-check-input {
            background-color: rgba(140, 140, 140, 0.4);
            border: 2px solid #333; /* Borda cinza escura */
            transition: background-color 0.3s ease-in-out, border-color 0.3s ease-in-out;
            cursor: pointer;
          }
          .custom-switch .form-check-input:checked {
            background-color: #0d6efd; /* Cor do switch ativado */
          }
          .custom-switch .form-check-input::before {
            // content: "";
            top: 0px;
            left: 0px;
            transition: transform 0.3s ease-in-out;
          }

          .custom-switch .form-check-input:checked::before {
            transform: translateX(1px); /* Mover a bolinha para o final */
          }
        `}
      </style>

      <ToastContainer />
      <Row>
        <Col xs={12} md={3} className="border-end p-3">
          {/* <h5 className="text-center fw-bold mt-3">
            Filtrar
          </h5> */}
          <Form>
            {userType === 1 && (
              <Card className="mb-3 shadow-sm">
                <Card.Header className="text-white">
                  <h6 className="mb-0">Filtrar por Categoria</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex flex-wrap gap-2 custom-checkboxes">
                    {opcoesCodigos.map((item, index) => (
                      <Form.Check
                        key={index}
                        type="checkbox"
                        label={item.etiqueta}
                        name={item.valor}
                        onChange={handleCodigoFilterChange}
                        checked={selectedCodigos.includes(item.valor)}
                        className="mb-2"
                      />
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}

            {Array.from(
              new Set(
                materiais.flatMap((material) =>
                  material.cp_mat_extra_categories &&
                    typeof material.cp_mat_extra_categories === "string"
                    ? material.cp_mat_extra_categories
                      .split(",")
                      .map((cat) => cat.trim())
                      .filter((cat) => cat !== "")
                    : []
                )
              )
            ).length > 0 && (
                <Card className="mb-3 shadow-sm h-100 p-0 radius-12">
                  <Card.Header className="border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                    <h6>TAG's</h6>
                  </Card.Header>
                  <Card.Body>
                    <div className="category-list">
                      <Form.Group className="mb-3">
                        {Array.from(
                          new Set(
                            materiais.flatMap((material) =>
                              material.cp_mat_extra_categories &&
                                typeof material.cp_mat_extra_categories === "string"
                                ? material.cp_mat_extra_categories
                                  .split(",")
                                  .map((cat) => cat.trim())
                                  .filter((cat) => cat !== "")
                                : []
                            )
                          )
                        ).map((category, index) => (
                          <Form.Check
                            key={index}
                            type="checkbox"
                            label={category}
                            name={category}
                            onChange={handleCategoryChange}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                            }}
                            checked={selectedCategories.includes(category)}
                          />
                        ))}
                      </Form.Group>
                    </div>
                  </Card.Body>
                </Card>
              )}


            <Card className="mb-3">
              <Card.Header>
                <h6>Pesquisar por Nome</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Digite o nome"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>
                <h6>Filtrar por Data</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                </Form.Group>
              </Card.Body>
            </Card>
            <div className="d-grid gap-2">
              <Button
                variant="primary"
                onClick={applyFilter}
                className="mt-3 w-100">
                Aplicar Filtro
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setFilterDate("");
                  setSelectedCategories([]);
                  setFilteredMateriais(materiais);
                }}
                className="mt-1 w-100"
              >
                Limpar Filtros
              </Button>
            </div>
          </Form>
        </Col>

        <Col xs={12} md={9}>
          <Card className="my-3">
            {userType === 1 && (
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    {/* Título e Miniatura */}
                    <Col md={4}>
                      <p>Miniatura</p>
                      <div
                        className="pdf-add-button border radius-8 text-center position-relative"
                        style={{
                          width: "100%",
                          height: "200px",
                          background: "#f8f9fa",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "center",
                          alignItems: "center",
                          cursor: "pointer",
                          padding: "0!important",
                          border: "4px solid #fff",
                        }}
                      >
                        <Form.Control
                          type="file"
                          name="miniatura"
                          accept="image/*"
                          style={{
                            opacity: 0,
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            cursor: "pointer",
                          }}
                          onChange={(e) => {
                            const file = e.target.files[0];
                            setFormData((prev) => ({
                              ...prev,
                              miniatura: file,
                            }));
                          }}
                        />
                        {formData.miniatura ? (
                          <Image
                            src={
                              typeof formData.miniatura === "string"
                                ? formData.miniatura
                                : URL.createObjectURL(formData.miniatura)
                            }
                            rounded
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <>
                            <Icon icon="carbon:add-alt" className="text-secondary text-xl" />
                            <span className="text-secondary mt-2" style={{ fontSize: "12px", fontWeight: "bold" }}>
                              Adicionar Miniatura<br />
                              (300px / 180px)
                            </span>
                          </>
                        )}
                      </div>
                      <Form.Group className="mt-3" controlId="formTitulo">
                        <Form.Label>Título</Form.Label>
                        <Form.Control
                          type="text"
                          name="titulo"
                          placeholder="Digite o título"
                          value={formData.titulo}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>

                    {/* Descrição, Data e URL do YouTube */}
                    <Col md={4}>
                      <Form.Group controlId="formDescricao" className="mt-3">
                        <Form.Label>Descrição</Form.Label>
                        <Form.Control
                          as="textarea"
                          name="descricao"
                          placeholder="Digite a descrição"
                          rows={6}
                          value={formData.descricao}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                      <Form.Group controlId="formDate" className="mt-3">
                        <Form.Label>Data</Form.Label>
                        <Form.Control
                          type="date"
                          name="data"
                          value={formData.data ? formData.data.split("T")[0] : ""}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                      <Form.Group controlId="formLinkYoutube" className="mt-3">
                        <Form.Label>URL do YouTube</Form.Label>
                        <Form.Control
                          type="text"
                          name="linkYoutube"
                          placeholder="Digite o link do vídeo"
                          value={formData.linkYoutube}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                    </Col>

                    {/* PDFs e Categorias */}
                    <Col md={4}>
                      <p>PDFs Anexados</p>
                      <div className="d-flex flex-wrap gap-2">
                        {[formData.arquivoPdf1, formData.arquivoPdf2, formData.arquivoPdf3]
                          .filter((pdf) => pdf)
                          .map((pdf, index) => (
                            <div
                              key={index}
                              className="pdf-card border radius-8 p-3 text-center position-relative"
                              style={{
                                width: "100px",
                                height: "150px",
                                background: "#f8f9fa",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <FaFilePdf className="text-danger text-xl" />
                              {/* <span
                                className="text-dark mt-2"
                                style={{ fontSize: "12px", fontWeight: "bold" }}
                              >
                                PDF {index + 1}
                              </span> */}
                              <span className="text-dark mt-2" style={{ fontSize: "12px", fontWeight: "bold" }}>
                                {typeof pdf === "string"
                                  ? truncarTexto(pdf.split("/").pop(), 15)
                                  : truncarTexto(pdf.name, 15)}
                              </span>

                              <Button
                                variant="link"
                                className="position-absolute top-0 end-0 p-1"
                                onClick={() => {
                                  const pdfKey = `arquivoPdf${index + 1}`;
                                  setFormData((prev) => ({
                                    ...prev,
                                    [pdfKey]: null,
                                  }));
                                }}
                              >
                                <FaTrash className="text-danger" />
                              </Button>
                            </div>
                          ))}
                        {uploadedPDFCount() < 3 && (
                          <div
                            className="pdf-add-button border radius-8 p-3 text-center position-relative"
                            style={{
                              width: "100px",
                              height: "150px",
                              background: "#f8f9fa",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                              alignItems: "center",
                              cursor: "pointer",
                            }}
                          >
                            <Form.Control
                              type="file"
                              multiple
                              accept=".pdf"
                              style={{
                                opacity: 0,
                                position: "absolute",
                                width: "100%",
                                height: "100%",
                                cursor: "pointer",
                              }}
                              onChange={(e) => handleFileUpload(e)}
                            />
                            <Icon icon="carbon:add-alt" className="text-secondary text-xl" />
                            <span className="text-secondary mt-2" style={{ fontSize: "12px", fontWeight: "bold" }}>
                              Adicionar
                            </span>
                          </div>
                        )}
                      </div>
                      <Form.Group controlId="formCodigos" className="mt-3">
                        <Form.Label>Categorias</Form.Label>
                        <div className="d-flex flex-wrap gap-2 custom-checkboxes">
                          {opcoesCodigos.map((item) => (
                            <Form.Check
                              inline
                              key={item.valor}
                              type="checkbox"
                              label={item.etiqueta}
                              value={item.valor}
                              checked={codigos.includes(item.valor)}
                              onChange={() => lidarCheckBox(item.valor)}
                            />
                          ))}
                        </div>
                      </Form.Group>
                      <style>
                        {`
                            .custom-checkboxes .form-check {
                              margin-bottom: 0;
                            }

                            .custom-checkboxes .form-check-input {
                              margin-top: 0;
                              margin-right: 4px;
                              vertical-align: middle;
                            }

                            .custom-checkboxes .form-check-label {
                              line-height: 1;
                              vertical-align: middle;
                              margin-bottom: 0;
                            }
                          `}
                      </style>


                      <Form.Group controlId="formCategories" className="mt-3">
                        <Form.Label>TAG's</Form.Label>
                        <Form.Control
                          type="text"
                          name="categorias"
                          placeholder="Digite as categorias separadas por vírgula"
                          value={formData.categorias}
                          onChange={handleInputChange}
                        />
                      </Form.Group>
                      <Form.Group controlId="formPermitirDownload" className="mt-3">
                        <Form.Label>Permitir Download</Form.Label>
                        <Form.Check
                          type="switch"
                          id="custom-switch"
                          label={<span style={{ marginLeft: "10px" }}>Permitir</span>}
                          className="custom-switch"
                          checked={formData.permitirDownload || false}
                          onChange={(e) =>
                            setFormData({ ...formData, permitirDownload: e.target.checked ? 1 : 0 })
                          }
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button
                    variant="primary"
                    type="submit"
                    className="mt-3 float-end"
                  >
                    {formData.id ? "Atualizar Material" : "Cadastrar Material"}
                  </Button>
                </Form>
              </Card.Body>
            )}
          </Card>



          <Col>
            {filteredMateriais.length === 0 ? (
              <p className="text-center">Nenhum material disponivel no momento</p>
            ) : (filteredMateriais.map((material, index) => (
              <Card className="my-3" key={index}>
                <Card.Body>
                  <Row className="g-3 flex-column flex-md-row">
                    <Col xs={12} md={4}>
                      {material.cp_mat_miniatura && (
                        <div
                          style={{
                            backgroundColor: "#eaeaea",
                            borderRadius: "10px",
                            width: "100%",
                            maxWidth: "300px",
                            height: "auto",
                            aspectRatio: "5 / 3",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            overflow: "hidden",
                            margin: "10px auto",
                          }}
                          className="position-relative"
                        >
                          <img
                            style={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                            src={material.cp_mat_miniatura}
                            alt={material.cp_mat_titulo}
                          />
                          {material.cp_mat_linkYoutube && (
                            <Button
                              onClick={() => handleOpenVideo(material.cp_mat_linkYoutube)}
                              className="magnific-video bordered-shadow w-56-px h-56-px bg-white rounded-circle d-flex justify-content-center align-items-center position-absolute start-50 top-50 translate-middle z-1"
                            >
                              <Icon icon="ion:play" className="text-primary-600 text-xxl" />
                            </Button>
                          )}
                        </div>
                      )}
                    </Col>
                    <Col xs={12} md={4}>
                      <h5>{material.cp_mat_titulo}</h5>
                      <p>{material.cp_mat_descricao}</p>
                      <p>{formatDateString(material.cp_mat_extra_date)}</p>
                    </Col>
                    <Col xs={12} md={4}>
                      {material.cp_mat_extra_categories &&
                        material.cp_mat_extra_categories.trim() !== "" && (
                          <>
                            <h6 style={{ fontWeight: "bold" }}>TAG's</h6>
                            <p>
                              {material.cp_mat_extra_categories
                                .split(",")
                                .map((cat, index) => (
                                  <span key={index} className="badge bg-secondary me-1">
                                    {cat.trim()}
                                  </span>
                                ))}
                            </p>
                            <hr style={{ paddingBottom: "20px" }} />
                          </>
                        )}
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        {[material.cp_mat_arquivoPdf, material.cp_mat_extra_pdf2, material.cp_mat_extra_pdf3]
                          .filter(Boolean)
                          .map((pdfUrl, index) => (
                            <div key={index} className="d-flex flex-wrap gap-0">
                              <Button
                                variant="primary"
                                className="px-3"
                                onClick={() => handleViewPDF(pdfUrl)}
                                style={{
                                  flex: "1 1 auto",
                                  minWidth: "150px",
                                  borderRadius: material.cp_mat_permitirDownload === 1 ? "5px 0 0 5px" : "5px",
                                  border: "none",
                                }}
                              >
                                Abrir {typeof pdfUrl === "string" ? truncarTexto(pdfUrl.split("/").pop(), 15) : truncarTexto(pdfUrl.name, 15)}
                              </Button>
                              {material.cp_mat_permitirDownload === 1 && (
                                <Button
                                  variant="success"
                                  className="px-3"
                                  onClick={() => handleDownload([pdfUrl])}
                                  style={{
                                    flex: "0 1 auto",
                                    borderRadius: "0 5px 5px 0",
                                    border: "none",
                                  }}
                                >
                                  <FaDownload />
                                </Button>
                              )}
                            </div>

                          ))}
                      </div>
                      {userType === 1 && (
                        <div className="d-flex gap-2 mt-3">
                          <Button variant="warning" onClick={() => handleEdit(material)} className="d-flex align-items-center" style={{ fontSize: "0.9rem" }}>
                            <FaEdit className="me-2" /> Editar
                          </Button>
                          <Button variant="danger" onClick={() => handleDelete(material.cp_mat_id)} className="d-flex align-items-center" style={{ fontSize: "0.9rem" }}>
                            <FaTrash className="me-2" /> Excluir
                          </Button>
                        </div>
                      )}
                    </Col>
                  </Row>

                </Card.Body>
              </Card>
            ))
            )}

          </Col>
        </Col>
      </Row>
      <Modal
        style={{ zIndex: "1050" }}
        show={showPDF}
        onHide={handleClose}
        centered
        fullscreen
        dialogClassName="modal-90w"
        className="custom-modal-size bg-dark text-white"
      >
        <Button
          variant="secondary"
          onClick={handleClose}
          className="position-absolute top-0 end-0 m-3"
          style={{
            zIndex: 1060,
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          ✕
        </Button>
        <iframe
          src={`https://docs.google.com/gview?url=${pdfUrl}&embedded=true&zoom=100`}
          width="100%"
          height="100%"
          className="border-0"
          title="PDF Viewer"
          style={{
            border: "none",
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
          }}
        />
      </Modal>


      <ModalVideo
        channel="youtube"
        youtube={{ mute: 0, autoplay: 0 }}
        isOpen={isOpen}
        videoId={videoId}
        onClose={() => setOpen(false)}
      />

    </Container>
  );
};

export default Treinamento;
