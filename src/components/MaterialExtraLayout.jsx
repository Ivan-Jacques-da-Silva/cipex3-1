import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Image,
  Modal,
} from "react-bootstrap";
import axios from "axios";
import { FaFilePdf, FaDownload, FaTrash, FaEdit } from "react-icons/fa";
import { Icon } from "@iconify/react/dist/iconify.js";
import ModalVideo from "react-modal-video";
import { Link } from "react-router-dom";

import { API_BASE_URL } from "./config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


function MaterialExtra() {
  const [thumbnail, setThumbnail] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [pdfs, setPdfs] = useState([]);
  const [categories, setCategories] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [showPDF, setShowPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [userType, setUserType] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [permitirDownload, setPermitirDownload] = useState(false);
  const [isOpen, setOpen] = useState(false);
  const [codigos, setCodigos] = useState([]);
  const [videoId, setVideoId] = useState("");
  const [selectedCodigos, setSelectedCodigos] = useState([]);
  const resetForm = () => {
    setThumbnail(null);
    setTitle("");
    setDescription("");
    setDate("");
    setYoutubeUrl("");
    setCategories("");
    setPermitirDownload(false);
    setPdfs([]);
    setEditingMaterialId(null);
  };

  const handleCodigoFilterChange = (event) => {
    const codigo = event.target.name;
    setSelectedCodigos((prev) =>
      prev.includes(codigo) ? prev.filter(c => c !== codigo) : [...prev, codigo]
    );
  };

  const getUserType = () => {
    const userType = localStorage.getItem("userType");
    return userType ? parseInt(userType, 10) : null;
  };

  useEffect(() => {
    const userType = getUserType();
    setUserType(userType);
  }, []);

  const handleViewPDF = (url) => {
    setPdfUrl(url);
    setShowPDF(true);
  };

  const truncarTexto = (texto, max = 15) => {
    if (!texto) return "";
    return texto.length > max ? texto.substring(0, max) + "..." : texto;
  };


  // const handleOpenVideo = (url) => {
  //   const videoUrlNormalizado = normalizarUrlYoutube(url);
  //   setVideoUrl(videoUrlNormalizado);
  //   setShowVideo(true);
  // };

  const handleOpenVideo = (url) => {
    const videoUrlNormalizado = normalizarUrlYoutube(url);
    const videoId = videoUrlNormalizado.split("embed/")[1]; // Extrai o ID do vídeo
    setVideoId(videoId);
    setOpen(true);
  };


  const handleClose = () => {
    setShowPDF(false);
    // setShowVideo(false);
  };

  const handleDownload = async (pdfUrls) => {
    setIsDownloading(true);
    let successCount = 0;

    try {
      for (let pdfUrl of pdfUrls) {
        if (pdfUrl) {
          // Certifique-se de que `API_BASE_URL` está correto
          const relativePath = pdfUrl.replace(API_BASE_URL, ""); // Caminho relativo
          window.open(`${API_BASE_URL}/proxy-download?url=${encodeURIComponent(relativePath)}`, "_blank");
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




  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/material-extra/${id}`);
      toast.success("Material excluído com sucesso!");
      fetchMaterials();
    } catch (error) {
      console.error("Erro ao excluir material:", error);
      toast.error("Erro ao excluir material.");
    }
  };



  const fetchMaterials = async () => {
    try {
      const tipoUsuario = localStorage.getItem("userType");
      const professorId = localStorage.getItem("userId");

      const res = await axios.get(`${API_BASE_URL}/material-extra`);
      const todosMateriais = res.data;

      // Admin vê tudo
      if (tipoUsuario === "1" || localStorage.getItem("userName") === "Andrea Carneiro Monteiro Dumoncel") {

        setMaterials(todosMateriais);
        setFilteredMaterials(todosMateriais);
        return;
      }

      // Professor: busca cursos e filtra
      const turmasRes = await axios.get(`${API_BASE_URL}/cp_turmas/professor/${professorId}`);
      const cursoIds = turmasRes.data.map(t => t.cp_tr_curso_id);

      const cursosRes = await axios.post(`${API_BASE_URL}/cursos/batch`, { cursoIds });
      const nomesCursos = cursosRes.data.map(curso => curso.cp_nome_curso);

      const codigosPermitidos = [...new Set(
        nomesCursos.map(nome => mapaCursosParaCodigo[nome]).filter(Boolean)
      )];

      const materiaisPermitidos = todosMateriais.filter(material => {
        const codigosMaterial = material.cp_mat_extra_codigos
          ? material.cp_mat_extra_codigos.split(",").map(c => c.trim())
          : [];
        return codigosMaterial.some(codigo => codigosPermitidos.includes(codigo));
      });

      setMaterials(materiaisPermitidos);
      setFilteredMaterials(materiaisPermitidos);
    } catch (error) {
      console.error("Erro ao buscar materiais", error);
    }
  };


  useEffect(() => {
    fetchMaterials();
  }, []);


  const handleThumbnailChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setThumbnail(event.target.files[0]);
    }
  };

  const handlePdfChange = (e) => {
    const files = Array.from(e.target.files);
    const updatedPdfs = [...pdfs];

    files.forEach((file, index) => {
      const slot = updatedPdfs.findIndex((pdf) => pdf === null || pdf === undefined);
      if (slot !== -1) {
        updatedPdfs[slot] = file;
      } else {
        updatedPdfs.push(file);
      }
    });

    setPdfs(updatedPdfs);
  };


  const handleEdit = (material) => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const formattedDate = material.cp_mat_extra_date
      ? new Date(material.cp_mat_extra_date).toISOString().split("T")[0]
      : "";

    setEditingMaterialId(material.cp_mat_extra_id); // Salva o ID do material em edição
    setThumbnail(material.cp_mat_extra_thumbnail || null);
    setTitle(material.cp_mat_extra_title || "");
    setDescription(material.cp_mat_extra_description || "");
    setDate(formattedDate);
    setYoutubeUrl(material.cp_mat_extra_youtube_url || "");
    setCategories(material.cp_mat_extra_categories || "");
    setPermitirDownload(material.cp_mat_extra_permitirDownload === 1);
    setPdfs([
      material.cp_mat_extra_pdf1 || null,
      material.cp_mat_extra_pdf2 || null,
      material.cp_mat_extra_pdf3 || null,
    ]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();

    formData.append("thumbnail", thumbnail);
    formData.append("title", title);
    formData.append("description", description);

    const formattedDate = date ? new Date(date).toISOString().split("T")[0] : "";
    formData.append("date", formattedDate);

    formData.append("youtube_url", youtubeUrl);
    formData.append("categories", categories);
    formData.append("codigos", codigos.join(","));
    formData.append("permitirDownload", permitirDownload ? 1 : 0);

    pdfs.forEach((pdf, index) => {
      if (pdf instanceof File) {
        formData.append(`pdf${index + 1}`, pdf);
      }
    });

    try {
      if (editingMaterialId) {
        // Atualizar material existente
        await axios.put(
          `${API_BASE_URL}/material-extra/${editingMaterialId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
        toast.success("Material atualizado com sucesso!");
      } else {
        // Criar novo material
        await axios.post(`${API_BASE_URL}/material-extra`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("Material cadastrado com sucesso!");
      }

      // Limpar formulário e atualizar lista de materiais
      resetForm(); // Chama a função para limpar os dados do formulário
      fetchMaterials();
    } catch (error) {
      console.error("Erro ao salvar material:", error);
      toast.error("Erro ao salvar material.");
    }
  };

  const handleCategoryChange = (event) => {
    const category = event.target.name;
    setSelectedCategories((prevCategories) =>
      prevCategories.includes(category)
        ? prevCategories.filter((c) => c !== category)
        : [...prevCategories, category]
    );
  };

  // Defina as opções dos códigos
  const opcoesCodigos = [
    { valor: "KIDS", etiqueta: "KIDS" },
    { valor: "TWEENS", etiqueta: "TWEENS" },
    { valor: "CES", etiqueta: "CES" },
    { valor: "CONVERSATION", etiqueta: "CONVERSATION" },
    { valor: "ESPANHOL", etiqueta: "ESPANHOL" },
    { valor: "DEUTSCH", etiqueta: "DEUTSCH" }
  ];

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

  // Manipulador de seleção
  const lidarCheckBox = (valor) => {
    setCodigos((prev) =>
      prev.includes(valor) ? prev.filter((v) => v !== valor) : [...prev, valor]
    );
  };

  useEffect(() => {
    const tipoUsuario = localStorage.getItem("userType");
    const userName = localStorage.getItem("userName");
    const professorId = localStorage.getItem("userId");

    if (tipoUsuario !== "1" && userName !== "Andrea Carneiro Monteiro Dumoncel") {
      axios.get(`${API_BASE_URL}/cp_turmas/professor/${professorId}`)
        .then(res => {
          const cursosDoProfessor = res.data.map(turma => turma.cp_tr_curso_id);

          axios.post(`${API_BASE_URL}/cursos/batch`, { cursoIds: cursosDoProfessor })
            .then(resCursos => {
              const nomesCursos = resCursos.data.map(curso => curso.cp_nome_curso);
              const codigosPermitidos = [...new Set(
                nomesCursos.map(nome => mapaCursosParaCodigo[nome]).filter(Boolean)
              )];

              const materiaisFiltrados = materials.filter(material => {
                const codigosMaterial = material.cp_mat_extra_codigos
                  ? material.cp_mat_extra_codigos.split(",").map(c => c.trim())
                  : [];
                return codigosMaterial.some(c => codigosPermitidos.includes(c));
              });

              setFilteredMaterials(materiaisFiltrados);
            });
        });
    }
  }, [materials]);



  const formatDateString = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-BR");
  };

  const applyFilter = () => {
    let filtered = materials;

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((material) =>
        selectedCategories.some((category) =>
          material.cp_mat_extra_categories
            .split(",")
            .map((cat) => cat.trim())
            .includes(category)
        )
      );
    }

    if (selectedCodigos.length > 0) {
      filtered = filtered.filter((material) => {
        const materialCodigos = material.cp_mat_extra_codigos
          ? material.cp_mat_extra_codigos.split(",").map(c => c.trim())
          : [];
        return selectedCodigos.some(codigo => materialCodigos.includes(codigo));
      });
    }

    if (searchTerm) {
      filtered = filtered.filter((material) =>
        material.cp_mat_extra_title
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }

    if (filterDate) {
      const selectedDate = new Date(filterDate).toISOString().split("T")[0];
      filtered = filtered.filter((material) => {
        const materialDate = new Date(material.cp_mat_extra_date)
          .toISOString()
          .split("T")[0];
        return materialDate === selectedDate;
      });
    }

    setFilteredMaterials(filtered);
  };

  const normalizarUrlYoutube = (url) => {
    let videoId = '';
    if (url.includes('watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    return `https://www.youtube.com/embed/${videoId}`;
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
            border-color: #0d6efd; /* Borda segue a cor do switch ativado */
          }
          .custom-switch .form-check-input::before {
            // content: "";
            top: 1px;
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
          {/* <h5 className="text-center fw-bold mt-3">Filtrar</h5> */}
          <Form>
            {(userType === 1 || localStorage.getItem("userName") === "Andrea Carneiro Monteiro Dumoncel") && (
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
            {materials.some(m => m.cp_mat_extra_categories && m.cp_mat_extra_categories.trim() !== "") && (
              <Card className="mb-3 shadow-sm h-100 p-0 radius-12">
                <Card.Header className="border-bottom bg-base py-16 px-24 d-flex align-items-center flex-wrap gap-3 justify-content-between">
                  <h6 className="mb-0">TAG's</h6>
                </Card.Header>
                <Card.Body>
                  <div className="category-list">
                    <Form.Group className="mb-3">
                      {Array.from(
                        new Set(
                          materials
                            .map((m) => m.cp_mat_extra_categories)
                            .filter(Boolean) // remove null/vazio
                            .flatMap((cats) =>
                              cats.split(",").map((cat) => cat.trim()).filter(Boolean)
                            )
                        )
                      ).map((category, index) => (
                        <Form.Check
                          key={index}
                          type="checkbox"
                          label={category}
                          name={category}
                          onChange={handleCategoryChange}
                          checked={selectedCategories.includes(category)}
                          className="mb-2"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px", // Espaço entre o checkbox e a label
                          }}
                        />
                      ))}
                    </Form.Group>
                  </div>

                </Card.Body>
              </Card>
            )}
            <Card className="mb-3 shadow-sm">
              <Card.Header className=" text-white">
                <h6 className="mb-0">Pesquisar por Nome</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="text"
                    placeholder="Digite o nome"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="mb-3 shadow-sm">
              <Card.Header className=" text-white">
                <h6 className="mb-0">Filtrar por Data</h6>
              </Card.Header>
              <Card.Body>
                <Form.Group className="mb-3">
                  <Form.Control
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="rounded"
                  />
                </Form.Group>
              </Card.Body>
            </Card>

            <div className="d-grid gap-2">
              <Button variant="primary" onClick={applyFilter} className="mt-3 w-100">
                Aplicar Filtro
              </Button>
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setFilterDate("");
                  setSelectedCategories([]);
                  setFilteredMaterials(materials);
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
          {(userType === 1 || localStorage.getItem("userName") === "Andrea Carneiro Monteiro Dumoncel") && (

              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Row>
                    {/* Miniatura e Título */}
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
                          border: "4px solid #fff",
                        }}
                      >
                        <Form.Control
                          type="file"
                          accept="image/*"
                          style={{
                            opacity: 0,
                            position: "absolute",
                            width: "100%",
                            height: "100%",
                            cursor: "pointer",
                          }}
                          onChange={(e) => handleThumbnailChange(e)}
                        />
                        {thumbnail ? (
                          <Image
                            src={
                              typeof thumbnail === "string"
                                ? thumbnail
                                : URL.createObjectURL(thumbnail)
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
                      <Form.Group className="mt-3" controlId="formTitle">
                        <Form.Label>Título</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Digite o título"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    {/* Descrição, Data e URL do YouTube */}
                    <Col md={4}>
                      <Form.Group controlId="formDescription" className="mt-3">
                        <Form.Label>Descrição</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={6}
                          placeholder="Digite a descrição"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </Form.Group>
                      <Form.Group controlId="formDate" className="mt-3">
                        <Form.Label>Data</Form.Label>
                        <Form.Control
                          type="date"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </Form.Group>
                      <Form.Group controlId="formYoutubeUrl" className="mt-3">
                        <Form.Label>URL do YouTube</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Digite a URL do YouTube"
                          value={youtubeUrl}
                          onChange={(e) => setYoutubeUrl(e.target.value)}
                        />
                      </Form.Group>
                    </Col>

                    {/* PDFs, Categorias e Permissão de Download */}
                    <Col md={4}>
                      <p>PDFs Anexados</p>
                      <div className="d-flex flex-wrap gap-2">
                        {[pdfs[0], pdfs[1], pdfs[2]]
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
                              <span
                                className="text-dark mt-2"
                                style={{ fontSize: "12px", fontWeight: "bold" }}
                              >
                                {/* PDF {index + 1} */}
                                {typeof pdf === "string"
                                  ? truncarTexto(pdf.split("/").pop(), 15)
                                  : truncarTexto(pdf.name, 15)}
                              </span>
                              <Button
                                variant="link"
                                className="position-absolute top-0 end-0 p-1"
                                onClick={() => {
                                  const updatedPdfs = [...pdfs];
                                  updatedPdfs[index] = null;
                                  setPdfs(updatedPdfs);
                                }}
                              >
                                <FaTrash className="text-danger" />
                              </Button>
                            </div>
                          ))}
                        {pdfs.filter(Boolean).length < 3 && (
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
                              onChange={(e) => handlePdfChange(e)}
                            />
                            <Icon icon="carbon:add-alt" className="text-secondary text-xl" />
                            <span className="text-secondary mt-2" style={{ fontSize: "12px", fontWeight: "bold" }}>
                              Adicionar
                            </span>
                          </div>
                        )}
                      </div>

                      <Form.Group controlId="formCodigos" className="mt-3">
                        <Form.Label>Categoria</Form.Label>
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
                          placeholder="Digite as tag's separadas por vírgula"
                          value={categories}
                          onChange={(e) => setCategories(e.target.value)}
                        />
                      </Form.Group>
                      <Form.Group controlId="formPermitirDownload" className="mt-3">
                        <Form.Label>Permitir Download</Form.Label>
                        <Form.Check
                          type="switch"
                          id="custom-switch"
                          label={<span style={{ marginLeft: "10px" }}>Permitir</span>}
                          className="custom-switch"
                          checked={permitirDownload}
                          onChange={(e) => setPermitirDownload(e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button
                    variant="primary"
                    type="submit"
                    className="mt-3 float-end"
                  >
                    {editingMaterialId ? "Atualizar Material" : "Cadastrar Material"}
                  </Button>
                </Form>
              </Card.Body>
            )}
          </Card>



          <Col>

            {filteredMaterials.length === 0 ? (
              <p className="text-center">Nenhum material disponivel no momento</p>
            ) : (
              filteredMaterials.map((material, index) => (
                <Card className="my-3" key={index}>
                  <Card.Body>
                    <Row className="g-3 flex-column flex-md-row">
                      <Col xs={12} md={4} className="d-flex justify-content-center">
                        {material.cp_mat_extra_thumbnail && (
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
                              src={material.cp_mat_extra_thumbnail}
                              alt={material.cp_mat_extra_title}
                              style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                              }}
                            />
                            {material.cp_mat_extra_youtube_url && (
                              <Link
                                onClick={() =>
                                  handleOpenVideo(material.cp_mat_extra_youtube_url)
                                }
                                to="#"
                                className="magnific-video bordered-shadow w-56-px h-56-px bg-white rounded-circle d-flex justify-content-center align-items-center position-absolute start-50 top-50 translate-middle z-1"
                              >
                                <Icon icon="ion:play" className="text-primary-600 text-xxl" />
                              </Link>
                            )}
                          </div>
                        )}
                      </Col>

                      <Col xs={12} md={4}>
                        <h5>{material.cp_mat_extra_title}</h5>
                        <p>{material.cp_mat_extra_description}</p>
                        <p>{formatDateString(material.cp_mat_extra_date)}</p>
                      </Col>

                      <Col xs={12} md={4}>
                        {material.cp_mat_extra_categories &&
                          material.cp_mat_extra_categories.trim() !== "" && (
                            <>
                              <h6 style={{ fontWeight: "bold" }}>TAG's</h6>
                              <p>
                                {material.cp_mat_extra_categories.split(",").map((cat, index) => (
                                  <span key={index} className="badge bg-secondary me-1">
                                    {cat.trim()}
                                  </span>
                                ))}
                              </p>
                              <hr style={{ paddingBottom: "20px" }} />
                            </>
                          )}
                        <div className="d-flex flex-wrap gap-2">
                          {[material.cp_mat_extra_pdf1, material.cp_mat_extra_pdf2, material.cp_mat_extra_pdf3]
                            .filter(Boolean)
                            .map((pdfUrl, index) => (
                              <div key={index} className="d-flex flex-wrap align-items-center gap-0">
                                <Button
                                  variant="primary"
                                  className="px-3"
                                  onClick={() => handleViewPDF(pdfUrl)}
                                  style={{
                                    flex: "1 1 auto",
                                    minWidth: "150px",
                                    borderRadius:
                                      Number(material.cp_mat_extra_permitirDownload) === 1
                                        ? "5px 0 0 5px"
                                        : "5px",
                                    border: "none",
                                  }}
                                >
                                  Abrir{" "}
                                  {typeof pdfUrl === "string"
                                    ? truncarTexto(pdfUrl.split("/").pop(), 15)
                                    : truncarTexto(pdfUrl.name, 15)}
                                </Button>

                                {Number(material.cp_mat_extra_permitirDownload) === 1 && (
                                  <Button
                                    variant="success"
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

                        {(userType === 1 || userType === 2) && (
                          <div className="mt-3 d-flex gap-2">
                            <Button
                              variant="warning"
                              onClick={() => handleEdit(material)}
                              className="d-flex align-items-center"
                              style={{ fontSize: "0.9rem" }}
                            >
                              <FaEdit className="me-2" />
                              Editar
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleDelete(material.cp_mat_extra_id)}
                              className="d-flex align-items-center"
                              style={{ fontSize: "0.9rem" }}
                            >
                              <FaTrash className="me-2" />
                              Excluir
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
        show={showPDF}
        onHide={handleClose}
        centered
        fullscreen
        className="bg-dark text-white"
        style={{ zIndex: 1050 }}
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
          src={`https://docs.google.com/gview?url=${pdfUrl}&embedded=true`}
          width="100%"
          height="100%"
          frameBorder="0"
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
}

export default MaterialExtra;
