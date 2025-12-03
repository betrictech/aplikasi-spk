"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Upload, Download, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import html2canvas from "html2canvas"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface SPKData {
  nama: string
  detailPekerjaan: string
  nominalGaji: string
  deadline: string
}

export default function SPKGenerator() {
  const [spkData, setSpkData] = useState<SPKData>({
    nama: "",
    detailPekerjaan: "",
    nominalGaji: "",
    deadline: "",
  })
  const [signatureUrl, setSignatureUrl] = useState<string>("")
  const [spkNumber, setSpkNumber] = useState<number>(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const spkRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load data from localStorage on mount
  useEffect(() => {
    const savedSignature = localStorage.getItem("adminSignature")
    const savedSpkNumber = localStorage.getItem("spkCounter")

    if (savedSignature) {
      setSignatureUrl(savedSignature)
    }
    if (savedSpkNumber) {
      setSpkNumber(Number.parseInt(savedSpkNumber))
    }
  }, [])

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Error",
          description: "File harus berupa gambar (PNG, JPG, dll)",
          variant: "destructive",
        })
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setSignatureUrl(result)
        localStorage.setItem("adminSignature", result)
        toast({
          title: "Berhasil",
          description: "Tanda tangan berhasil disimpan",
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, "")
    return new Intl.NumberFormat("id-ID").format(Number.parseInt(number) || 0)
  }

  const handleInputChange = (field: keyof SPKData, value: string) => {
    setSpkData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const generateSPK = async () => {
    // Validation
    if (!spkData.nama || !spkData.detailPekerjaan || !spkData.nominalGaji || !spkData.deadline) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      })
      return
    }

    if (!signatureUrl) {
      toast({
        title: "Error",
        description: "Silakan upload tanda tangan admin terlebih dahulu di tab Pengaturan Admin",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      // Wait for DOM to update
      await new Promise((resolve) => setTimeout(resolve, 100))

      if (spkRef.current) {
        const canvas = await html2canvas(spkRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
          logging: false,
        })

        // Convert to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `SPK-${String(spkNumber).padStart(4, "0")}-${spkData.nama.replace(/\s+/g, "-")}.png`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            // Increment counter and save
            const newSpkNumber = spkNumber + 1
            setSpkNumber(newSpkNumber)
            localStorage.setItem("spkCounter", newSpkNumber.toString())

            toast({
              title: "Berhasil",
              description: `SPK nomor ${String(spkNumber).padStart(4, "0")} berhasil di-generate`,
            })

            // Reset form
            setSpkData({
              nama: "",
              detailPekerjaan: "",
              nominalGaji: "",
              deadline: "",
            })
          }
        }, "image/png")
      }
    } catch (error) {
      console.error("Error generating SPK:", error)
      toast({
        title: "Error",
        description: "Gagal membuat SPK. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const resetCounter = () => {
    setSpkNumber(1)
    localStorage.setItem("spkCounter", "1")
    toast({
      title: "Berhasil",
      description: "Nomor SPK berhasil direset ke 0001",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Generator SPK</h1>
          <p className="text-slate-600">Sistem Generate Surat Perintah Kerja Otomatis</p>
        </div>

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="generate" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Generate SPK
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Pengaturan Admin
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Input */}
              <Card>
                <CardHeader>
                  <CardTitle>Form Input SPK</CardTitle>
                  <CardDescription>Isi data untuk membuat Surat Perintah Kerja baru</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Pekerja</Label>
                    <Input
                      id="nama"
                      placeholder="Masukkan nama lengkap"
                      value={spkData.nama}
                      onChange={(e) => handleInputChange("nama", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="detailPekerjaan">Detail Pekerjaan</Label>
                    <Textarea
                      id="detailPekerjaan"
                      placeholder="Jelaskan detail pekerjaan yang harus dikerjakan"
                      rows={4}
                      value={spkData.detailPekerjaan}
                      onChange={(e) => handleInputChange("detailPekerjaan", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nominalGaji">Nominal Gaji (Rp)</Label>
                    <Input
                      id="nominalGaji"
                      placeholder="Masukkan nominal gaji"
                      value={spkData.nominalGaji}
                      onChange={(e) => handleInputChange("nominalGaji", e.target.value)}
                    />
                    {spkData.nominalGaji && (
                      <p className="text-sm text-muted-foreground">Rp {formatCurrency(spkData.nominalGaji)}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline Pekerjaan</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={spkData.deadline}
                      onChange={(e) => handleInputChange("deadline", e.target.value)}
                    />
                  </div>

                  <div className="pt-4">
                    <Button onClick={generateSPK} disabled={isGenerating} className="w-full" size="lg">
                      <Download className="mr-2 h-4 w-4" />
                      {isGenerating ? "Membuat SPK..." : "Generate & Download SPK"}
                    </Button>
                  </div>

                  <div className="pt-2 text-center">
                    <p className="text-sm text-muted-foreground">
                      Nomor SPK Selanjutnya:{" "}
                      <span className="font-bold text-foreground">{String(spkNumber).padStart(4, "0")}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Preview SPK */}
              <Card>
                <CardHeader>
                  <CardTitle>Preview SPK</CardTitle>
                  <CardDescription>Preview akan muncul setelah mengisi form</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-white min-h-[500px] flex items-center justify-center">
                    {spkData.nama || spkData.detailPekerjaan || spkData.nominalGaji || spkData.deadline ? (
                      <div
                        ref={spkRef}
                        className="w-full bg-white p-8 text-slate-900 font-sans"
                        style={{ minHeight: "600px" }}
                      >
                        {/* Header */}
                        <div className="text-center mb-8 border-b-2 border-slate-900 pb-4">
                          <h2 className="text-2xl font-bold mb-1">SURAT PERINTAH KERJA</h2>
                          <p className="text-sm">
                            No: {String(spkNumber).padStart(4, "0")}/SPK/{format(new Date(), "MM/yyyy")}
                          </p>
                        </div>

                        {/* Content */}
                        <div className="space-y-6 mb-12">
                          <div className="grid grid-cols-[120px_10px_1fr] gap-2">
                            <span className="font-semibold">Nama</span>
                            <span>:</span>
                            <span>{spkData.nama || "-"}</span>
                          </div>

                          <div className="grid grid-cols-[120px_10px_1fr] gap-2">
                            <span className="font-semibold">Pekerjaan</span>
                            <span>:</span>
                            <div className="whitespace-pre-wrap">{spkData.detailPekerjaan || "-"}</div>
                          </div>

                          <div className="grid grid-cols-[120px_10px_1fr] gap-2">
                            <span className="font-semibold">Nilai Kontrak</span>
                            <span>:</span>
                            <span>{spkData.nominalGaji ? `Rp ${formatCurrency(spkData.nominalGaji)}` : "-"}</span>
                          </div>

                          <div className="grid grid-cols-[120px_10px_1fr] gap-2">
                            <span className="font-semibold">Deadline</span>
                            <span>:</span>
                            <span>
                              {spkData.deadline
                                ? format(new Date(spkData.deadline), "dd MMMM yyyy", {
                                    locale: id,
                                  })
                                : "-"}
                            </span>
                          </div>
                        </div>

                        {/* Signature Section */}
                        <div className="flex justify-end mt-16">
                          <div className="text-center">
                            <p className="mb-12">{format(new Date(), "dd MMMM yyyy", { locale: id })}</p>
                            <p className="font-semibold mb-2">Menyetujui,</p>
                            {signatureUrl && (
                              <div className="flex justify-center mb-2">
                                <img
                                  src={signatureUrl || "/placeholder.svg"}
                                  alt="Tanda tangan"
                                  className="h-20 w-auto"
                                />
                              </div>
                            )}
                            <div className="border-t border-slate-900 pt-1 min-w-[200px]">
                              <p className="font-semibold">Direktur</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center">Isi form untuk melihat preview SPK</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Pengaturan Admin</CardTitle>
                  <CardDescription>Upload tanda tangan dan kelola nomor SPK</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Signature Upload */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="signature">Tanda Tangan Admin</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload tanda tangan sekali saja. Akan digunakan untuk semua SPK.
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <Button asChild variant="outline">
                        <label htmlFor="signature" className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          {signatureUrl ? "Ganti Tanda Tangan" : "Upload Tanda Tangan"}
                          <input
                            id="signature"
                            type="file"
                            accept="image/*"
                            onChange={handleSignatureUpload}
                            className="hidden"
                          />
                        </label>
                      </Button>
                    </div>

                    {signatureUrl && (
                      <div className="border rounded-lg p-4 bg-slate-50">
                        <p className="text-sm font-medium mb-2">Preview Tanda Tangan:</p>
                        <div className="flex justify-center p-4 bg-white rounded border">
                          <img
                            src={signatureUrl || "/placeholder.svg"}
                            alt="Preview tanda tangan"
                            className="h-24 w-auto"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SPK Counter */}
                  <div className="space-y-4 pt-6 border-t">
                    <div>
                      <Label>Nomor SPK</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Nomor SPK saat ini: <span className="font-bold">{String(spkNumber).padStart(4, "0")}</span>
                      </p>
                    </div>

                    <Button onClick={resetCounter} variant="destructive">
                      Reset Nomor SPK ke 0001
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster />

      {/* Hidden SPK for generation (used when button clicked) */}
      <div className="fixed -left-[9999px] -top-[9999px]">
        <div ref={spkRef} className="w-[794px] bg-white p-16 text-slate-900 font-sans" style={{ minHeight: "1123px" }}>
          {/* This is the actual SPK that will be converted to image */}
          <div className="text-center mb-12 border-b-4 border-slate-900 pb-6">
            <h2 className="text-4xl font-bold mb-2">SURAT PERINTAH KERJA</h2>
            <p className="text-lg">
              No: {String(spkNumber).padStart(4, "0")}/SPK/{format(new Date(), "MM/yyyy")}
            </p>
          </div>

          <div className="space-y-8 mb-20 text-lg">
            <div className="grid grid-cols-[180px_20px_1fr] gap-4">
              <span className="font-semibold">Nama</span>
              <span>:</span>
              <span>{spkData.nama}</span>
            </div>

            <div className="grid grid-cols-[180px_20px_1fr] gap-4">
              <span className="font-semibold">Pekerjaan</span>
              <span>:</span>
              <div className="whitespace-pre-wrap">{spkData.detailPekerjaan}</div>
            </div>

            <div className="grid grid-cols-[180px_20px_1fr] gap-4">
              <span className="font-semibold">Nilai Kontrak</span>
              <span>:</span>
              <span>Rp {formatCurrency(spkData.nominalGaji)}</span>
            </div>

            <div className="grid grid-cols-[180px_20px_1fr] gap-4">
              <span className="font-semibold">Deadline</span>
              <span>:</span>
              <span>{spkData.deadline && format(new Date(spkData.deadline), "dd MMMM yyyy", { locale: id })}</span>
            </div>
          </div>

          <div className="flex justify-end mt-24">
            <div className="text-center text-lg">
              <p className="mb-20">{format(new Date(), "dd MMMM yyyy", { locale: id })}</p>
              <p className="font-semibold mb-4">Menyetujui,</p>
              {signatureUrl && (
                <div className="flex justify-center mb-4">
                  <img src={signatureUrl || "/placeholder.svg"} alt="Tanda tangan" className="h-28 w-auto" />
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-2 min-w-[250px]">
                <p className="font-semibold text-xl">Direktur</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
