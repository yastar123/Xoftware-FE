// pages/cookies.js
import React from "react"
import LegalPageShell from "@/Comp/LegalPageShell"
import Config from "@/config"

const CookiesPage = () => (
  <LegalPageShell
    title="Kebijakan Cookie"
    metaTitle="Kebijakan Cookie - Xoftware"
    content={Config.cookies}
  />
)

export default CookiesPage
