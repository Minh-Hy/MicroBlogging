import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'

const execPromise = promisify(exec)

const MAXIMUM_BITRATE_720P = 5 * 10 ** 6
const MAXIMUM_BITRATE_1080P = 8 * 10 ** 6
const MAXIMUM_BITRATE_1440P = 16 * 10 ** 6

const runCommand = async (command: string) => {
  const { stdout } = await execPromise(command)
  return stdout.trim()
}

export const checkVideoHasAudio = async (filePath: string) => {
  const cmd = `ffprobe -v error -select_streams a:0 -show_entries stream=codec_type -of default=nw=1:nk=1 "${filePath}"`
  const output = await runCommand(cmd)
  return output === 'audio'
}

const getBitrate = async (filePath: string) => {
  const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=bit_rate -of default=nw=1:nk=1 "${filePath}"`
  const output = await runCommand(cmd)
  return Number(output)
}

const getResolution = async (filePath: string) => {
  const cmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 "${filePath}"`
  const output = await runCommand(cmd)
  const [width, height] = output.split('x').map(Number)
  return { width, height }
}

const getWidth = (height: number, resolution: { width: number; height: number }) => {
  const width = Math.round((height * resolution.width) / resolution.height)
  return width % 2 === 0 ? width : width + 1
}

type EncodeByResolution = {
  inputPath: string
  isHasAudio: boolean
  resolution: { width: number; height: number }
  outputSegmentPath: string
  outputPath: string
  bitrate: { 720: number; 1080: number; 1440: number; original: number }
}

const execFFmpeg = async (args: string[]) => {
  const command = `ffmpeg ${args.join(' ')}`
  await execPromise(command)
}

const encodeMax720 = async ({ bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution }: EncodeByResolution) => {
  const args = [
    '-y',
    '-i', `"${inputPath}"`,
    '-preset', 'veryslow',
    '-g', '48',
    '-crf', '17',
    '-sc_threshold', '0',
    '-map', '0:0'
  ]
  if (isHasAudio) args.push('-map', '0:1')

  args.push(
    '-s:v:0', `${getWidth(720, resolution)}x720`,
    '-c:v:0', 'libx264',
    '-b:v:0', bitrate[720].toString(),
    '-c:a', 'copy',
    '-var_stream_map', isHasAudio ? 'v:0,a:0' : 'v:0',
    '-master_pl_name', 'master.m3u8',
    '-f', 'hls',
    '-hls_time', '6',
    '-hls_list_size', '0',
    '-hls_segment_filename', `"${outputSegmentPath}"`,
    `"${outputPath}"`
  )
  await execFFmpeg(args)
}

const encodeMax1080 = async ({ bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution }: EncodeByResolution) => {
  const args = ['-y', '-i', `"${inputPath}"`, '-preset', 'veryslow', '-g', '48', '-crf', '17', '-sc_threshold', '0']
  if (isHasAudio) args.push('-map', '0:0', '-map', '0:1', '-map', '0:0', '-map', '0:1')
  else args.push('-map', '0:0', '-map', '0:0')

  args.push(
    '-s:v:0', `${getWidth(720, resolution)}x720`,
    '-c:v:0', 'libx264',
    '-b:v:0', bitrate[720].toString(),
    '-s:v:1', `${getWidth(1080, resolution)}x1080`,
    '-c:v:1', 'libx264',
    '-b:v:1', bitrate[1080].toString(),
    '-c:a', 'copy',
    '-var_stream_map', isHasAudio ? 'v:0,a:0 v:1,a:1' : 'v:0 v:1',
    '-master_pl_name', 'master.m3u8',
    '-f', 'hls',
    '-hls_time', '6',
    '-hls_list_size', '0',
    '-hls_segment_filename', `"${outputSegmentPath}"`,
    `"${outputPath}"`
  )
  await execFFmpeg(args)
}

const encodeMax1440 = async ({ bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution }: EncodeByResolution) => {
  const args = ['-y', '-i', `"${inputPath}"`, '-preset', 'veryslow', '-g', '48', '-crf', '17', '-sc_threshold', '0']
  if (isHasAudio) args.push('-map', '0:0', '-map', '0:1', '-map', '0:0', '-map', '0:1', '-map', '0:0', '-map', '0:1')
  else args.push('-map', '0:0', '-map', '0:0', '-map', '0:0')

  args.push(
    '-s:v:0', `${getWidth(720, resolution)}x720`,
    '-c:v:0', 'libx264',
    '-b:v:0', bitrate[720].toString(),
    '-s:v:1', `${getWidth(1080, resolution)}x1080`,
    '-c:v:1', 'libx264',
    '-b:v:1', bitrate[1080].toString(),
    '-s:v:2', `${getWidth(1440, resolution)}x1440`,
    '-c:v:2', 'libx264',
    '-b:v:2', bitrate[1440].toString(),
    '-c:a', 'copy',
    '-var_stream_map', isHasAudio ? 'v:0,a:0 v:1,a:1 v:2,a:2' : 'v:0 v:1 v:2',
    '-master_pl_name', 'master.m3u8',
    '-f', 'hls',
    '-hls_time', '6',
    '-hls_list_size', '0',
    '-hls_segment_filename', `"${outputSegmentPath}"`,
    `"${outputPath}"`
  )
  await execFFmpeg(args)
}

const encodeMaxOriginal = async ({ bitrate, inputPath, isHasAudio, outputPath, outputSegmentPath, resolution }: EncodeByResolution) => {
  const args = ['-y', '-i', `"${inputPath}"`, '-preset', 'veryslow', '-g', '48', '-crf', '17', '-sc_threshold', '0']
  if (isHasAudio) args.push('-map', '0:0', '-map', '0:1', '-map', '0:0', '-map', '0:1', '-map', '0:0', '-map', '0:1')
  else args.push('-map', '0:0', '-map', '0:0', '-map', '0:0')

  args.push(
    '-s:v:0', `${getWidth(720, resolution)}x720`,
    '-c:v:0', 'libx264',
    '-b:v:0', bitrate[720].toString(),
    '-s:v:1', `${getWidth(1080, resolution)}x1080`,
    '-c:v:1', 'libx264',
    '-b:v:1', bitrate[1080].toString(),
    '-s:v:2', `${resolution.width}x${resolution.height}`,
    '-c:v:2', 'libx264',
    '-b:v:2', bitrate.original.toString(),
    '-c:a', 'copy',
    '-var_stream_map', isHasAudio ? 'v:0,a:0 v:1,a:1 v:2,a:2' : 'v:0 v:1 v:2',
    '-master_pl_name', 'master.m3u8',
    '-f', 'hls',
    '-hls_time', '6',
    '-hls_list_size', '0',
    '-hls_segment_filename', `"${outputSegmentPath}"`,
    `"${outputPath}"`
  )
  await execFFmpeg(args)
}

export const encodeHLSWithMultipleVideoStreams = async (inputPath: string) => {
  const [bitrate, resolution] = await Promise.all([getBitrate(inputPath), getResolution(inputPath)])
  const parent_folder = path.dirname(inputPath)
  const outputSegmentPath = path.join(parent_folder, 'v%v', 'fileSequence%d.ts')
  const outputPath = path.join(parent_folder, 'v%v', 'prog_index.m3u8')
  const bitrate720 = Math.min(bitrate, MAXIMUM_BITRATE_720P)
  const bitrate1080 = Math.min(bitrate, MAXIMUM_BITRATE_1080P)
  const bitrate1440 = Math.min(bitrate, MAXIMUM_BITRATE_1440P)
  const isHasAudio = await checkVideoHasAudio(inputPath)

  let encodeFunc = encodeMax720
  if (resolution.height > 720) encodeFunc = encodeMax1080
  if (resolution.height > 1080) encodeFunc = encodeMax1440
  if (resolution.height > 1440) encodeFunc = encodeMaxOriginal

  await encodeFunc({
    bitrate: { 720: bitrate720, 1080: bitrate1080, 1440: bitrate1440, original: bitrate },
    inputPath,
    isHasAudio,
    outputPath,
    outputSegmentPath,
    resolution
  })

  return true
}
