"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, AlertCircle, Mouse, Command, MonitorSmartphone } from "lucide-react"
import Image from "next/image"

export function TutorialContent() {
  const [activePlatform, setActivePlatform] = useState<"mac" | "pc">("pc")
  const [activeStep, setActiveStep] = useState(1)

  const macSteps = [
    {
      step: 1,
      title: "Navigate to Your Google Drive Folder",
      description: "Open Finder and go to your Google Drive folder where the Scientology documents are stored.",
      screenshot: "/screenshots/mac/scientology-folder.png",
      details: [
        "Open Finder (the blue smiling face icon in your dock)",
        "Look for 'Google Drive' in the sidebar under Favorites",
        "Click on Google Drive to open it",
        "Navigate to the Scientology folder",
        "You'll see all your document folders here"
      ],
      mouseInfo: {
        iconType: "command",
        text: "Mac uses Command (⌘) key for shortcuts"
      }
    },
    {
      step: 2,
      title: "Select Files and Copy Paths",
      description: "Select the PDF files you want to add. On Mac, click on files while holding the Command (⌘) key to select multiple files.",
      screenshot: "/screenshots/mac/copy-path.png",
      details: [
        "Click on the first PDF file to select it",
        "Hold down the Command (⌘) key and click other files to select multiple",
        "Once files are selected, RIGHT-CLICK on one of them (or Control + Click if you have a one-button mouse)",
        "From the menu, choose 'Copy as Pathname' or 'Copy as Path'",
        "The file paths are now copied to your clipboard"
      ],
      mouseInfo: {
        iconType: "mouse",
        text: "Mac: Right-click OR hold Control + Click for one-button mouse"
      }
    },
    {
      step: 3,
      title: "Use Quick Import in the App",
      description: "Go to the Import page in this app, paste the file paths you copied (Command+V), and click 'Auto Detect'.",
      screenshot: "/screenshots/mac/quick-import.png",
      details: [
        "Click 'Import' in the top menu of this app",
        "Click inside the large text box",
        "Press Command (⌘) + V to paste the file paths",
        "Click the 'Auto Detect' button",
        "Wait a few seconds for the app to analyze your files"
      ],
      mouseInfo: {
        icon: <Command className="h-4 w-4" />,
        text: "Mac uses Command (⌘) + V to paste"
      }
    },
    {
      step: 4,
      title: "Generate and Import CSV",
      description: "After auto-detect finishes, click 'Generate CSV', download it using the yellow button, then click 'Import CSV'.",
      screenshot: "/screenshots/mac/import-csv.png",
      details: [
        "Scroll down and click the 'Generate CSV' button",
        "A popup window will appear",
        "Click the yellow 'Download CSV' button in the popup",
        "Close the popup",
        "Scroll down and click 'Import CSV' button to complete the import",
        "Your documents are now imported!"
      ],
      mouseInfo: null
    }
  ]

  const pcSteps = [
    {
      step: 1,
      title: "Navigate to Your Google Drive Folder",
      description: "Open File Explorer and go to your Google Drive folder where the Scientology documents are stored.",
      screenshot: "/screenshots/pc/scientology-folder.png",
      details: [
        "Open File Explorer (folder icon in taskbar or press Windows key + E)",
        "Look for 'Google Drive (G:)' in the left sidebar",
        "Click on Google Drive to open it",
        "Navigate to the Scientology folder",
        "You'll see all your document folders here"
      ],
      mouseInfo: {
        iconType: "monitor",
        text: "PC uses Ctrl key for shortcuts"
      }
    },
    {
      step: 2,
      title: "Select Files and Copy Paths",
      description: "Select the PDF files you want to add. On Windows, click on files while holding the Ctrl key to select multiple files.",
      screenshot: "/screenshots/pc/copy-path.png",
      details: [
        "Click on the first PDF file to select it",
        "Hold down the Ctrl key and click other files to select multiple",
        "Once files are selected, hold Shift and RIGHT-CLICK on one of the selected files",
        "From the menu, choose 'Copy as path'",
        "The file paths are now copied to your clipboard"
      ],
      mouseInfo: {
        iconType: "mouse",
        text: "Windows: Hold Shift + Right-click to see 'Copy as path'"
      }
    },
    {
      step: 3,
      title: "Use Quick Import in the App",
      description: "Go to the Import page in this app, paste the file paths you copied (Ctrl+V), and click 'Auto Detect'.",
      screenshot: "/screenshots/pc/quick-import.png",
      details: [
        "Click 'Import' in the top menu of this app",
        "Click inside the large text box",
        "Press Ctrl + V to paste the file paths",
        "Click the 'Auto Detect' button",
        "Wait a few seconds for the app to analyze your files"
      ],
      mouseInfo: {
        icon: <MonitorSmartphone className="h-4 w-4" />,
        text: "Windows uses Ctrl + V to paste"
      }
    },
    {
      step: 4,
      title: "Generate and Import CSV",
      description: "After auto-detect finishes, click 'Generate CSV', download it using the yellow button, then click 'Import CSV'.",
      screenshot: "/screenshots/pc/import-csv.png",
      details: [
        "Scroll down and click the 'Generate CSV' button",
        "A popup window will appear",
        "Click the yellow 'Download CSV' button in the popup",
        "Close the popup",
        "Scroll down and click 'Import CSV' button to complete the import",
        "Your documents are now imported!"
      ],
      mouseInfo: null
    }
  ]

  const currentSteps = activePlatform === "mac" ? macSteps : pcSteps
  const currentStep = currentSteps[activeStep - 1]

  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">How to Add Documents</h1>
        <p className="text-muted-foreground mt-2">
          Follow these simple steps to add documents to the system
        </p>
      </div>

      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-900">
            <AlertCircle className="h-5 w-5" />
            Important - File Naming Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="text-orange-900">
          <p>
            Computers don't like spaces or uppercase letters in file names. Always use hyphens (-) instead of spaces, and use lowercase letters.
          </p>
          <div className="mt-4 space-y-2">
            <p><span className="font-semibold">✗ Wrong:</span> "Auditor Courses" or "1967 Dianetic Auditing Course.pdf"</p>
            <p><span className="font-semibold">✓ Correct:</span> "auditor-courses" or "1967-dianetic-auditing-course.pdf"</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button
          variant={activePlatform === "pc" ? "default" : "outline"}
          onClick={() => {
            setActivePlatform("pc")
            setActiveStep(1)
          }}
        >
          <MonitorSmartphone className="h-4 w-4 mr-2" />
          Windows PC Instructions
        </Button>
        <Button
          variant={activePlatform === "mac" ? "default" : "outline"}
          onClick={() => {
            setActivePlatform("mac")
            setActiveStep(1)
          }}
        >
          <Command className="h-4 w-4 mr-2" />
          Mac Instructions
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <span className="inline-block bg-primary text-primary-foreground text-sm font-medium px-3 py-1 rounded-full">
              Step {activeStep} of 4
            </span>
            <div className="flex gap-2">
              {currentSteps.map((step) => (
                <button
                  key={step.step}
                  onClick={() => setActiveStep(step.step)}
                  className={`w-10 h-10 rounded-full font-medium transition-colors ${
                    activeStep === step.step
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {step.step}
                </button>
              ))}
            </div>
          </div>
          <CardTitle className="text-2xl mb-3">{currentStep.title}</CardTitle>
          <CardDescription className="text-base">{currentStep.description}</CardDescription>
          
          {currentStep.mouseInfo && (
            <div className="mt-3 flex items-center gap-2 text-sm bg-blue-50 text-blue-900 px-3 py-2 rounded-md border border-blue-200">
              {currentStep.mouseInfo.iconType === "command" && <Command className="h-4 w-4" />}
              {currentStep.mouseInfo.iconType === "mouse" && <Mouse className="h-4 w-4" />}
              {currentStep.mouseInfo.iconType === "monitor" && <MonitorSmartphone className="h-4 w-4" />}
              <span className="font-medium">{currentStep.mouseInfo.text}</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 mb-6">
            <div className="bg-white rounded-lg border-2 border-border overflow-hidden">
              <div className="relative w-full" style={{ minHeight: "400px" }}>
                <Image
                  src={currentStep.screenshot}
                  alt={currentStep.title}
                  width={1920}
                  height={1080}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Detailed Steps:</h3>
            <ol className="space-y-2">
              {currentStep.details.map((detail, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground font-medium flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <span className="text-sm pt-0.5">{detail}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex justify-between gap-4">
            <Button
              variant="outline"
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              disabled={activeStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Step
            </Button>
            <Button
              onClick={() => setActiveStep(Math.min(4, activeStep + 1))}
              disabled={activeStep === 4}
            >
              Next Step
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Steps Overview</CardTitle>
          <CardDescription>Click any step to jump directly to it</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {currentSteps.map((step) => (
              <button
                key={step.step}
                onClick={() => setActiveStep(step.step)}
                className={`p-4 rounded-lg border-2 text-left transition-colors ${
                  activeStep === step.step
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium flex items-center justify-center">
                    {step.step}
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">{step.title}</h4>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Alternative Option</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-900">
          <p>
            If you prefer, you can simply add several folders to Google Drive and send an email to the administrator. 
            They will add all the documents to the system for you.
          </p>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-muted-foreground italic">
          It might seem complicated at first, but it's really just a series of simple steps!
        </p>
      </div>
    </>
  )
}
