// pages/privacy.js
import React from "react"
import LegalPageShell from "@/Comp/LegalPageShell"
import Config from "@/config"

const PrivacyPage = () => (
  <LegalPageShell
    title="Kebijakan Privasi"
    metaTitle="Kebijakan Privasi - Xoftware"
    content={Config.privacy}
  />
)

export default PrivacyPage
