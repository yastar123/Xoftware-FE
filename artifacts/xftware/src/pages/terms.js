// pages/terms.js
import React from "react"
import LegalPageShell from "@/Comp/LegalPageShell"
import config from "@/config"

const TermsPage = () => (
  <LegalPageShell
    title="Syarat & Ketentuan"
    metaTitle="Syarat & Ketentuan - Xoftware"
    content={config.term}
  />
)

export default TermsPage
