'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, Square, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { BottomNav } from '@/components/bottom-nav'
import { MapView } from '@/components/map-view'

type RideState = 'idle' | 'recording' | 'paused' | 'finished'

export default function RidePage() {
  const [rideState, setRideState] = useState<RideState>('idle')
  const [elapsedTime, setElapsedTime] = useState(0)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    if (rideState !== 'recording') return

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
      setDistance((prev) => prev + 0.005 + Math.random() * 0.003)
    }, 1000)

    return () => clearInterval(timer)
  }, [rideState])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const avgSpeed = elapsedTime > 0 ? (distance / (elapsedTime / 3600)).toFixed(1) : '0.0'

  const handleStart = () => setRideState('recording')
  const handlePause = () => setRideState('paused')
  const handleResume = () => setRideState('recording')
  const handleStop = () => setRideState('finished')
  const handleSave = () => {
    setRideState('idle')
    setElapsedTime(0)
    setDistance(0)
  }
  const handleDiscard = () => {
    setRideState('idle')
    setElapsedTime(0)
    setDistance(0)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-center px-4">
          <h1 className="font-semibold text-foreground">
            {rideState === 'idle' && '라이딩 시작하기'}
            {rideState === 'recording' && '라이딩 중...'}
            {rideState === 'paused' && '일시정지'}
            {rideState === 'finished' && '라이딩 완료'}
          </h1>
        </div>
      </header>

      <main className="mx-auto flex flex-1 flex-col max-w-md w-full">
        {/* Map */}
        <MapView className="h-64 rounded-none" showCurrentLocation />

        {/* Stats Panel */}
        <div className="flex-1 p-4">
          {rideState === 'idle' ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500">
                <Play className="h-12 w-12 text-white" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">
                라이딩을 시작해보세요
              </h2>
              <p className="mb-8 text-muted-foreground">
                버튼을 눌러 라이딩을 기록할 수 있어요
              </p>
              <Button
                size="lg"
                className="h-16 w-48 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-lg font-semibold shadow-lg hover:from-emerald-600 hover:to-teal-600"
                onClick={handleStart}
              >
                <Play className="mr-2 h-6 w-6" />
                시작
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Main Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="col-span-3">
                  <CardContent className="flex flex-col items-center p-6">
                    <span className="text-5xl font-bold text-foreground tabular-nums">
                      {formatTime(elapsedTime)}
                    </span>
                    <span className="mt-2 text-sm text-muted-foreground">
                      경과 시간
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center p-4">
                    <span className="text-2xl font-bold text-foreground">
                      {distance.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">km</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center p-4">
                    <span className="text-2xl font-bold text-foreground">
                      {avgSpeed}
                    </span>
                    <span className="text-xs text-muted-foreground">km/h</span>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex flex-col items-center p-4">
                    <span className="text-2xl font-bold text-foreground">
                      {rideState === 'recording' ? 'REC' : 'PAUSE'}
                    </span>
                    <span className="text-xs text-muted-foreground">상태</span>
                  </CardContent>
                </Card>
              </div>

              {/* Controls */}
              {rideState === 'finished' ? (
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-14 rounded-full px-8"
                    onClick={handleDiscard}
                  >
                    삭제
                  </Button>
                  <Button
                    size="lg"
                    className="h-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 hover:from-emerald-600 hover:to-teal-600"
                    onClick={handleSave}
                  >
                    <Save className="mr-2 h-5 w-5" />
                    저장하기
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-16 w-16 rounded-full"
                    onClick={rideState === 'recording' ? handlePause : handleResume}
                  >
                    {rideState === 'recording' ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8" />
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="h-16 w-16 rounded-full"
                    onClick={handleStop}
                  >
                    <Square className="h-8 w-8" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
