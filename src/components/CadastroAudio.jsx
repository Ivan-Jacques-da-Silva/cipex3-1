import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Row, Col, Button, Form, Modal } from "react-bootstrap";
axios.defaults.maxContentLength = Infinity;
axios.defaults.maxBodyLength = Infinity;

const CadastroAudio = ({ audioID }) => {
  const estadoInicial = {
    cp_curso_id: "",
    cp_audio: [],
    cp_youtube_link_curso: "",
    cp_pdfs: [],
  };
  const [isLoading, setIsLoading] = useState(false);
  const [cursos, setCursos] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [audioData, setAudioData] = useState(estadoInicial);

  // Lista fixa de cursos (opções)
  const opcoesCursos = [
    { value: "FERRIS WHEEL 1", label: "[ING] - FERRIS WHEEL 1" },
    { value: "FERRIS WHEEL 2", label: "[ING] - FERRIS WHEEL 2" },
    { value: "FERRIS WHEEL 3", label: "[ING] - FERRIS WHEEL 3" },
    { value: "BEST BUDDIES 1", label: "[ING] - BEST BUDDIES 1" },
    { value: "BEST BUDDIES 2", label: "[ING] - BEST BUDDIES 2" },
    { value: "BEST BUDDIES 3", label: "[ING] - BEST BUDDIES 3" },
    { value: "KIDS 1", label: "[ING] - Kids 1" },
    { value: "KIDS 2", label: "[ING] - Kids 2" },
    { value: "NEXT STATION STARTER", label: "[ING] - NEXT STATION STARTER" },
    { value: "NEXT STATION 2", label: "[ING] - NEXT STATION 2" },
    { value: "NEXT STATION 3", label: "[ING] - NEXT STATION 3" },
    { value: "CIPEX TWEENS 1", label: "[ING] - CIPEX TWEENS 1" },
    { value: "CIPEX TWEENS 2", label: "[ING] - CIPEX TWEENS 2" },
    { value: "CIPEX TWEENS 3", label: "[ING] - CIPEX TWEENS 3" },
    { value: "CIPEX TWEENS 4", label: "[ING] - CIPEX TWEENS 4" },
    { value: "CIPEX TWEENS 5", label: "[ING] - CIPEX TWEENS 5" },
    { value: "CIPEX TWEENS 6", label: "[ING] - CIPEX TWEENS 6" },
    { value: "CIPEX TWEENS 7", label: "[ING] - CIPEX TWEENS 7" },
    { value: "CIPEX ENGLISH BOOK 1", label: "[ING] - CIPEX ENGLISH BOOK 1" },
    { value: "CIPEX ENGLISH BOOK 2", label: "[ING] - CIPEX ENGLISH BOOK 2" },
    { value: "CIPEX ENGLISH BOOK 3", label: "[ING] - CIPEX ENGLISH BOOK 3" },
    { value: "CIPEX ENGLISH BOOK 4", label: "[ING] - CIPEX ENGLISH BOOK 4" },
    { value: "CIPEX ENGLISH BOOK 5", label: "[ING] - CIPEX ENGLISH BOOK 5" },
    { value: "CIPEX ENGLISH BOOK 6", label: "[ING] - CIPEX ENGLISH BOOK 6" },
    { value: "CIPEX ENGLISH BOOK 7", label: "[ING] - CIPEX ENGLISH BOOK 7" },
    { value: "TV BOX CONVERSATION VOL. 1", label: "[ING] - TV BOX CONVERSATION VOL. 1" },
    { value: "TV BOX CONVERSATION VOL. 2", label: "[ING] - TV BOX CONVERSATION VOL. 2" },
    { value: "THE BUSINESS PRE-INTERMEDIATE", label: "[ING] - The Business Pre-Intermediate" },
    { value: "THE BUSINESS INTERMEDIATE", label: "[ING] - The Business Intermediate" },
    { value: "THE BUSINESS UPPER-INTERMEDIATE", label: "[ING] - The Business Upper-Intermediate" },
    { value: "THE BUSINESS ADVANCED", label: "[ING] - The Business Advanced" },
    { value: "IN COMPANY 3.0 PRE-INTERMEDIATE", label: "[ING] - In Company 3.0 Pre-Intermediate" },
    { value: "IN COMPANY 3.0 INTERMEDIATE", label: "[ING] - In Company 3.0 Intermediate" },
    { value: "IN COMPANY 3.0 UPPER-INTERMEDIATE", label: "[ING] - In Company 3.0 Upper-Intermediate" },
    { value: "IN COMPANY 3.0 ADVANCED", label: "[ING] - In Company 3.0 Advanced" },
    { value: "NUEVO ESPAÑOL EN MARCHA 1", label: "[ESP] - NUEVO ESPAÑOL EN MARCHA 1" },
    { value: "NUEVO ESPAÑOL EN MARCHA 2", label: "[ESP] - NUEVO ESPAÑOL EN MARCHA 2" },
    { value: "NUEVO ESPAÑOL EN MARCHA 3", label: "[ESP] - NUEVO ESPAÑOL EN MARCHA 3" },
    { value: "NUEVO ESPAÑOL EN MARCHA 4", label: "[ESP] - NUEVO ESPAÑOL EN MARCHA 4" },
    { value: "ALFABETIZACAO", label: "[ALE] - ALFABETIZAÇÃO" },
    { value: "MOMENTE A1", label: "[ALE] - MOMENTE A1" },
    { value: "MOMENTE A2", label: "[ALE] - MOMENTE A2" },
    { value: "MOMENTE B1", label: "[ALE] - MOMENTE B1" },
    { value: "ASPEKTE B1", label: "[ALE] - ASPEKTE B1" },
    { value: "ASPEKTE B2", label: "[ALE] - ASPEKTE B2" },
    { value: "DAF+", label: "[ALE] - DAF+" },
    { value: "RUSSO A1", label: "[RUS] RUSSO A1" },
    
    // { value: "TESTE", label: "[TT] - TESTE" }
  ];

  useEffect(() => {
    fetchCursos();
  }, []);

  // useEffect(() => {
  //   if (audioID) {
  //     axios.get(`${API_BASE_URL}/audios/${audioID}`)
  //       .then((response) => {
  //         setAudioData(response.data);
  //       })
  //       .catch((error) => {
  //         toast.error("Erro ao carregar dados do áudio");
  //       });
  //   }
  // }, [audioID]);

  useEffect(() => {
    if (audioID) {
      buscarCurso(audioID);
      buscarAudiosDoCurso(audioID);
    }
  }, [audioID]);

  const buscarCurso = async (idCurso) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/cursos/${idCurso}`);
      const link = resp.data.cp_youtube_link_curso
      const courseName = resp.data.cp_nome_curso;
      const matchingOption = opcoesCursos.find(option => option.value === courseName);
      setAudioData((dadosAntigos) => ({
        ...dadosAntigos,
        cp_curso_id: matchingOption ? matchingOption.value : "",
        // cp_youtube_link_curso: resp.data.cp_youtube_link_curso || "",
        cp_youtube_link_curso: link == "null" ? "" : link,
        cp_pdfs: [
          resp.data.cp_pdf1_curso,
          resp.data.cp_pdf2_curso,
          resp.data.cp_pdf3_curso,
        ].filter(Boolean), // remove nulls
        nomeCurso: courseName,
      }));

    } catch (erro) {
      toast.error("Erro ao carregar curso");
    }
  };



  const buscarAudiosDoCurso = async (idCurso) => {
    try {
      const resp = await axios.get(`${API_BASE_URL}/audios-curso/${idCurso}`);
      setAudioData((dadosAntigos) => ({
        ...dadosAntigos,
        cp_audio: resp.data // array de áudios do curso
      }));
      // console.log("Nomes dos áudios:", resp.data.map(audio => audio.cp_nome_audio));
    } catch (erro) {
      toast.error("Erro ao carregar áudios");
    }
  };



  const fetchCursos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cursos`);
      setCursos(response.data);
    } catch (error) {
      console.error("Erro ao buscar os cursos:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAudioData((prevAudioData) => ({ ...prevAudioData, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { files, name } = e.target;
    if (name === "cp_audio") {
      const novosAudios = [...(audioData.cp_audio || []), ...Array.from(files)];
      setAudioData((prevAudioData) => ({ ...prevAudioData, cp_audio: novosAudios }));
    } else if (name === "cp_pdfs") {
      if (files.length + audioData.cp_pdfs.length > 3) {
        toast.error("Máximo de 3 PDFs permitidos.");
        return;
      }
      const novosPdfs = [...(audioData.cp_pdfs || []), ...Array.from(files)].slice(0, 3);
      setAudioData((prevAudioData) => ({ ...prevAudioData, cp_pdfs: novosPdfs }));
    }
  };

  const removeFile = (index, type) => {
    if (type === "audio") {
      setAudioData((prevAudioData) => ({ ...prevAudioData, cp_audio: [] }));
    } else if (type === "pdf") {
      setAudioData((prevAudioData) => ({
        ...prevAudioData,
        cp_pdfs: prevAudioData.cp_pdfs.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (audioID) {
        // 1. Atualiza dados do curso (nome, link e PDFs)
        const cursoFormData = new FormData();
        cursoFormData.append("cp_nome_curso", audioData.cp_curso_id);
        cursoFormData.append("cp_youtube_link_curso", audioData.cp_youtube_link_curso || "");

        audioData.cp_pdfs.forEach((pdf, index) => {
          if (pdf instanceof File) {
            cursoFormData.append(`pdf${index + 1}`, pdf);
          }
        });

        await axios.put(`${API_BASE_URL}/update-curso/${audioID}`, cursoFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        // 2. Atualiza os áudios separadamente, usando a rota /update-audio
        // const audiosNovos = audioData.cp_audio.filter((a) => a instanceof File);
        const audiosNovos = audioData.cp_audio.filter(a => a?.type?.startsWith('audio/'));

        if (audiosNovos.length > 0) {
          const audioFormData = new FormData();
          audiosNovos.forEach((audio) => {
            audioFormData.append("audios", audio);
          });
          await axios.put(`${API_BASE_URL}/update-audio/${audioID}`, audioFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }

        toast.success("Curso e áudios atualizados com sucesso!");
      } else {
        const cursoFormData = new FormData();
        cursoFormData.append("cp_nome_curso", audioData.cp_curso_id);
        cursoFormData.append("cp_youtube_link_curso", audioData.cp_youtube_link_curso);

        audioData.cp_pdfs.forEach((pdf, index) => {
          cursoFormData.append(`pdf${index + 1}`, pdf);
        });

        const response = await axios.post(`${API_BASE_URL}/cursos`, cursoFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const cursoId = response.data.cursoId;

        if (audioData.cp_audio.length > 0) {
          const audioFormData = new FormData();
          audioData.cp_audio.forEach((audio) => {
            audioFormData.append("audios", audio);
          });
          await axios.post(`${API_BASE_URL}/register-audio/${cursoId}`, audioFormData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }

        toast.success("Curso e áudios cadastrados com sucesso!");
        setAudioData(estadoInicial);
      }
    } catch (error) {
      console.error("❌ Erro ao processar o áudio:", error);
      toast.error("Erro ao processar o áudio");
      if (!audioID && error.response?.data?.cursoId) {
        await axios.delete(`${API_BASE_URL}/cursos/${error.response.data.cursoId}`);
      }
    } finally {
      setIsLoading(false);
    }
  };


  const handleConfirmSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(false);
    handleSubmit(e);
  };

  return (
    <div>
      {isLoading && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div className="spinner-border text-light" role="status"></div>
        </div>
      )}

      <form className="form-container-cad" onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="card-title mb-0">Informações do Áudio</h6>
              </div>
              <div className="card-body">
                <Form.Control
                  as="select"
                  id="cp_curso_id"
                  name="cp_curso_id"
                  value={audioData.cp_curso_id} // Esse value determina a seleção
                  onChange={handleChange}

                  required
                >
                  <option value="">Selecione o curso</option>
                  {opcoesCursos.map((curso) => (
                    <option key={curso.value} value={curso.value}>
                      {curso.label}
                    </option>
                  ))}
                </Form.Control>

                <Form.Group className="mt-3">
                  <Form.Label>Link do YouTube</Form.Label>
                  <Form.Control
                    type="url"
                    id="cp_youtube_link_curso"
                    name="cp_youtube_link_curso"
                    // value={audioData.cp_youtube_link_curso}
                    value={audioData.cp_youtube_link_curso ?? ""}
                    onChange={handleChange}
                    placeholder="Cole o link do YouTube"
                  />
                </Form.Group>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="card-title mb-0">Uploads</h6>
              </div>
              <div className="card-body">
                <Row className="gy-3">
                  <Col md={12}>
                    <div className="upload-wrapper d-flex align-items-center gap-3 flex-wrap">
                      {audioData.cp_audio.length > 0 ? (
                        <div className="uploaded-file-preview position-relative h-120-px w-120-px border input-form-light radius-8 overflow-hidden border-dashed bg-light">
                          <button
                            type="button"
                            className="remove-file position-absolute top-0 end-0 z-1 text-2xxl line-height-1 me-8 mt-8 d-flex"
                            onClick={() =>
                              setAudioData((prev) => ({ ...prev, cp_audio: [] }))
                            }
                          >
                            ×
                          </button>
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                            <span style={{ fontSize: "40px" }} className="text-primary text-4xl">
                              🎵
                            </span>
                          </div>
                          <p
                            style={{
                              position: "absolute",
                              bottom: "-18px",
                              left: "50%",
                              transform: "translateX(-50%)",
                              fontSize: "16px",
                              fontWeight: "bold",
                              color: "#333",
                              textAlign: "center",
                              lineHeight: "1.2",
                            }}
                          >
                            <span>({audioData.cp_audio.length})</span>
                            <br />
                            <span>
                              áudio{audioData.cp_audio.length !== 1 ? "s" : ""}
                            </span>
                          </p>
                        </div>
                      ) : (
                        <label
                          className="upload-file-multiple h-120-px w-120-px border input-form-light radius-8 overflow-hidden border-dashed bg-light d-flex align-items-center flex-column justify-content-center gap-1"
                          htmlFor="upload-audio"
                        >
                          <span className="text-secondary-light text-3xl">+</span>
                          <span className="fw-semibold text-secondary-light">
                            Áudio
                          </span>
                          <input
                            id="upload-audio"
                            type="file"
                            hidden
                            name="cp_audio"
                            accept="audio/*"
                            multiple
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                      {audioData.cp_pdfs.map((pdf, index) => (
                        <div
                          key={index}
                          className="uploaded-file-preview position-relative h-120-px w-120-px border input-form-light radius-8 overflow-hidden border-dashed bg-light"
                        >
                          <button
                            type="button"
                            className="remove-file position-absolute top-0 end-0 z-1 text-2xxl line-height-1 me-8 mt-8 d-flex"
                            onClick={() => removeFile(index, "pdf")}
                          >
                            ×
                          </button>
                          <div className="w-100 h-100 d-flex align-items-center justify-content-center">
                            <span style={{ fontSize: "40px" }} className="text-dark text-5xl">
                              📄
                            </span>
                          </div>
                        </div>
                      ))}
                      {audioData.cp_pdfs.length < 3 && (
                        <label
                          className="upload-file-multiple h-120-px w-120-px border input-form-light radius-8 overflow-hidden border-dashed bg-light d-flex align-items-center flex-column justify-content-center gap-1"
                          htmlFor="upload-pdfs"
                        >
                          <span className="text-secondary-light text-3xl">+</span>
                          <span className="fw-semibold text-secondary-light">
                            PDFs
                          </span>
                          <input
                            id="upload-pdfs"
                            type="file"
                            hidden
                            name="cp_pdfs"
                            accept="application/pdf"
                            multiple
                            onChange={handleFileChange}
                          />
                        </label>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>
            </div>
          </Col>
        </Row>
        <div className="mt-4 text-center">
          <Button type="button" variant="primary" onClick={() => setShowConfirmModal(true)}>
            {audioID ? "Salvar Alterações" : "Cadastrar Áudio"}
          </Button>
        </div>
      </form>
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Cadastro</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Tem certeza de que deseja {audioID ? "salvar as alterações" : "cadastrar este áudio"}?
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={(e) => handleConfirmSubmit(e)}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default CadastroAudio;
