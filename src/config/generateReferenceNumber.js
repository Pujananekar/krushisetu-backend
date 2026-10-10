const generateReferenceNumber =(id,type) =>{
     const date = new Date()

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    return `KR-${type}-${year}${month}${day}-${String(id).padStart(4, "0")}`
}

export default generateReferenceNumber